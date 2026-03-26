import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { VehicleScheduleSlot } from '../fleet/entities/vehicle-schedule-slot.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../shared/mail/mail.service';
import { PaymentsService } from '../shared/payments/payments.service';
import {
  buildPaginatedResponse,
  resolvePagination,
  type PaginatedResponse,
} from '../shared/pagination/pagination.util';
import { ConfirmReservationPaymentDto } from './dto/confirm-reservation-payment.dto';
import { UsersService } from '../users/users.service';
import {
  Vehicle,
  VehicleOperationalStatus,
} from '../vehicles/entities/vehicle.entity';
import { CreateReservationEventDto } from './dto/create-reservation-event.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateStripePreauthDto } from './dto/create-stripe-preauth.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ReservationEvent } from './entities/reservation-event.entity';
import { Reservation, ReservationStatus } from './entities/reservation.entity';

const BLOCKING_STATUSES: ReservationStatus[] = [
  ReservationStatus.NOUVELLE_DEMANDE,
  ReservationStatus.EN_ANALYSE,
  ReservationStatus.PROPOSITION_ENVOYEE,
  ReservationStatus.EN_ATTENTE_PAIEMENT,
  ReservationStatus.CONFIRMEE,
  ReservationStatus.EN_COURS,
];

const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.NOUVELLE_DEMANDE]: [
    ReservationStatus.EN_ANALYSE,
    ReservationStatus.ANNULEE,
    ReservationStatus.REFUSEE,
  ],
  [ReservationStatus.EN_ANALYSE]: [
    ReservationStatus.PROPOSITION_ENVOYEE,
    ReservationStatus.REFUSEE,
    ReservationStatus.ANNULEE,
  ],
  [ReservationStatus.PROPOSITION_ENVOYEE]: [
    ReservationStatus.EN_ATTENTE_PAIEMENT,
    ReservationStatus.ANNULEE,
  ],
  [ReservationStatus.EN_ATTENTE_PAIEMENT]: [
    ReservationStatus.CONFIRMEE,
    ReservationStatus.ANNULEE,
  ],
  [ReservationStatus.CONFIRMEE]: [
    ReservationStatus.EN_COURS,
    ReservationStatus.ANNULEE,
  ],
  [ReservationStatus.EN_COURS]: [ReservationStatus.CLOTUREE],
  [ReservationStatus.CLOTUREE]: [],
  [ReservationStatus.ANNULEE]: [],
  [ReservationStatus.REFUSEE]: [],
};

const STATUS_EVENT_MAP: Record<ReservationStatus, string> = {
  [ReservationStatus.NOUVELLE_DEMANDE]: 'reservation_created',
  [ReservationStatus.EN_ANALYSE]: 'reservation_commercial_reviewed',
  [ReservationStatus.PROPOSITION_ENVOYEE]: 'reservation_counter_offer_sent',
  [ReservationStatus.EN_ATTENTE_PAIEMENT]: 'reservation_counter_offer_sent',
  [ReservationStatus.CONFIRMEE]: 'reservation_stripe_preauth_created',
  [ReservationStatus.EN_COURS]: 'reservation_vehicle_handover',
  [ReservationStatus.CLOTUREE]: 'reservation_closed',
  [ReservationStatus.ANNULEE]: 'reservation_closed',
  [ReservationStatus.REFUSEE]: 'reservation_closed',
};

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(ReservationEvent)
    private readonly reservationEventRepository: Repository<ReservationEvent>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(VehicleScheduleSlot)
    private readonly slotRepository: Repository<VehicleScheduleSlot>,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateReservationDto): Promise<Reservation> {
    this.ensureDateRange(dto.startAt, dto.endAt);

    const requesterEmail = dto.requesterEmail.toLowerCase();
    let shouldSendGuestSetupEmail = false;

    if (!dto.userId) {
      const existingUser = await this.usersService.findByEmail(requesterEmail);
      if (existingUser) {
        dto.userId = existingUser.id;
      } else {
        const guestUser = await this.usersService.createGuestAccount({
          email: requesterEmail,
          requesterName: dto.requesterName,
          phone: dto.requesterPhone,
        });
        dto.userId = guestUser.id;
        shouldSendGuestSetupEmail = true;
      }
    }

    if (dto.vehicleId) {
      await this.ensureVehicleAssignable(dto.vehicleId);
      await this.ensureNoVehicleOverlap(dto.vehicleId, dto.startAt, dto.endAt);
    }

    const reservation = this.reservationRepository.create({
      ...dto,
      userId: dto.userId ?? null,
      vehicleId: dto.vehicleId ?? null,
      requesterEmail,
      companyName: dto.companyName ?? null,
      companySiret: dto.companySiret ?? null,
      amountTtc: (dto.amountTtc ?? 0).toFixed(2),
      depositAmount: (dto.depositAmount ?? 0).toFixed(2),
      publicReference: this.generatePublicReference(),
      status: ReservationStatus.NOUVELLE_DEMANDE,
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    // First timeline event is always emitted at creation to anchor lifecycle tracking.
    await this.reservationEventRepository.save(
      this.reservationEventRepository.create({
        reservationId: savedReservation.id,
        type: 'reservation_created',
        occurredAt: new Date(),
        payload: {
          status: savedReservation.status,
          publicReference: savedReservation.publicReference,
        },
      }),
    );

    await this.appendSystemEvent(
      savedReservation.id,
      'reservation_ack_email_sent',
      {
        channel: 'email',
      },
    );
    await this.appendSystemEvent(
      savedReservation.id,
      'reservation_admin_notified',
      {
        channel: 'internal',
      },
    );

    try {
      await this.mailService.sendReservationAcknowledgement({
        to: savedReservation.requesterEmail,
        requesterName: savedReservation.requesterName,
        publicReference: savedReservation.publicReference,
      });

      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        await this.mailService.sendReservationAdminNotification({
          to: adminEmail,
          requesterName: savedReservation.requesterName,
          requesterEmail: savedReservation.requesterEmail,
          publicReference: savedReservation.publicReference,
        });
      }

      await this.notificationsService.createForAdmin({
        type: 'reservation',
        title: 'Nouvelle demande de reservation',
        message: `${savedReservation.requesterName} a soumis la demande ${savedReservation.publicReference}.`,
        metadata: {
          reservationId: savedReservation.id,
          publicReference: savedReservation.publicReference,
        },
      });

      if (savedReservation.userId) {
        await this.notificationsService.createForUser({
          type: 'reservation',
          title: 'Demande de reservation enregistree',
          message: `Votre demande ${savedReservation.publicReference} a bien ete enregistree.`,
          recipientUserId: savedReservation.userId,
          metadata: {
            reservationId: savedReservation.id,
            publicReference: savedReservation.publicReference,
            status: savedReservation.status,
          },
        });
      }

      if (shouldSendGuestSetupEmail) {
        const setupUrl = await this.authService.createPasswordSetupUrl(
          savedReservation.requesterEmail,
        );
        if (setupUrl) {
          await this.mailService.sendGuestAccountSetupEmail({
            to: savedReservation.requesterEmail,
            requesterName: savedReservation.requesterName,
            publicReference: savedReservation.publicReference,
            setupUrl,
          });
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Reservation ${savedReservation.id} created but notification pipeline partially failed: ${reason}`,
      );
    }

    return this.findOne(savedReservation.id);
  }

  async findAll(
    page = 1,
    limit = 20,
    userId?: string,
  ): Promise<PaginatedResponse<Reservation>> {
    const pagination = resolvePagination(page, limit);
    const query = this.reservationRepository.createQueryBuilder('r');
    
    // Apply userId filter if provided
    if (userId) {
      query.andWhere('r.userId = :userId', { userId });
    }
    
    query
      .andWhere('r.archivedAt IS NULL')
      .orderBy('r.createdAt', 'DESC')
      .leftJoinAndSelect('r.vehicle', 'vehicle')
      .leftJoinAndSelect('r.user', 'user')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [items, totalItems] = await query.getManyAndCount();

    return buildPaginatedResponse(
      items,
      pagination.page,
      pagination.limit,
      totalItems,
    );
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id, archivedAt: IsNull() },
      relations: { vehicle: true, user: true, events: true },
      order: { events: { occurredAt: 'ASC' } },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async update(id: string, dto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);

    const nextStartAt = dto.startAt ?? reservation.startAt;
    const nextEndAt = dto.endAt ?? reservation.endAt;
    const nextVehicleId = dto.vehicleId ?? reservation.vehicleId;

    this.ensureDateRange(nextStartAt, nextEndAt);

    if (dto.vehicleId !== undefined && dto.vehicleId !== null) {
      await this.ensureVehicleAssignable(dto.vehicleId);
    }

    if (nextVehicleId) {
      await this.ensureNoVehicleOverlap(
        nextVehicleId,
        nextStartAt,
        nextEndAt,
        reservation.id,
      );
    }

    Object.assign(reservation, {
      ...dto,
      userId: dto.userId ?? reservation.userId,
      vehicleId: dto.vehicleId ?? reservation.vehicleId,
      requesterEmail:
        dto.requesterEmail?.toLowerCase() ?? reservation.requesterEmail,
      companyName: dto.companyName ?? reservation.companyName,
      companySiret: dto.companySiret ?? reservation.companySiret,
      amountTtc:
        dto.amountTtc !== undefined
          ? dto.amountTtc.toFixed(2)
          : reservation.amountTtc,
      depositAmount:
        dto.depositAmount !== undefined
          ? dto.depositAmount.toFixed(2)
          : reservation.depositAmount,
    });

    await this.reservationRepository.save(reservation);

    await this.reservationEventRepository.save(
      this.reservationEventRepository.create({
        reservationId: reservation.id,
        type: 'reservation_updated',
        occurredAt: new Date(),
        payload: {
          hasDateChange:
            dto.startAt !== undefined ||
            dto.endAt !== undefined ||
            dto.vehicleId !== undefined,
        },
      }),
    );

    return this.findOne(reservation.id);
  }

  async updateStatus(
    id: string,
    dto: UpdateReservationStatusDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);

    if (reservation.status === dto.status) {
      return reservation;
    }

    const allowedStatuses = ALLOWED_TRANSITIONS[reservation.status] ?? [];
    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${reservation.status} to ${dto.status}`,
      );
    }

    reservation.status = dto.status;
    await this.reservationRepository.save(reservation);

    await this.appendSystemEvent(reservation.id, 'reservation_status_changed', {
      status: dto.status,
      comment: dto.comment ?? null,
    });

    await this.appendSystemEvent(
      reservation.id,
      STATUS_EVENT_MAP[dto.status] ?? 'reservation_status_changed',
      { status: dto.status, comment: dto.comment ?? null },
    );

    try {
      if (reservation.userId) {
        await this.notificationsService.createForUser({
          type: 'reservation',
          title: 'Mise a jour de reservation',
          message: `Le statut de votre reservation ${reservation.publicReference} est maintenant ${dto.status}.`,
          recipientUserId: reservation.userId,
          metadata: {
            reservationId: reservation.id,
            publicReference: reservation.publicReference,
            status: dto.status,
          },
        });
      }

      await this.mailService.sendReservationStatusUpdate({
        to: reservation.requesterEmail,
        requesterName: reservation.requesterName,
        publicReference: reservation.publicReference,
        newStatus: dto.status,
        comment: dto.comment,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Status notification email failed for reservation ${reservation.id}: ${reason}`,
      );
    }

    return this.findOne(reservation.id);
  }

  async createStripePreauth(
    reservationId: string,
    dto: CreateStripePreauthDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(reservationId);

    if (reservation.status !== ReservationStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException(
        'Stripe preauthorization is only allowed from EN_ATTENTE_PAIEMENT status',
      );
    }

    await this.appendSystemEvent(
      reservation.id,
      'reservation_stripe_preauth_created',
      {
        provider: 'STRIPE',
        amount: dto.amount ?? Number(reservation.depositAmount),
        currency: 'EUR',
        preauthStatus: 'AUTHORIZED',
      },
    );

    await this.reservationRepository.update(
      { id: reservation.id },
      { status: ReservationStatus.CONFIRMEE },
    );

    await this.appendSystemEvent(reservation.id, 'reservation_status_changed', {
      status: ReservationStatus.CONFIRMEE,
    });

    try {
      if (reservation.userId) {
        await this.notificationsService.createForUser({
          type: 'reservation',
          title: 'Paiement confirme',
          message: `Votre reservation ${reservation.publicReference} est confirmee.`,
          recipientUserId: reservation.userId,
          metadata: {
            reservationId: reservation.id,
            publicReference: reservation.publicReference,
            status: ReservationStatus.CONFIRMEE,
          },
        });
      }

      await this.mailService.sendReservationStatusUpdate({
        to: reservation.requesterEmail,
        requesterName: reservation.requesterName,
        publicReference: reservation.publicReference,
        newStatus: ReservationStatus.CONFIRMEE,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Preauth confirmation email failed for reservation ${reservation.id}: ${reason}`,
      );
    }

    return this.findOne(reservation.id);
  }

  async createPaymentSession(
    reservationId: string,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    const reservation = await this.findOne(reservationId);

    if (reservation.status !== ReservationStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException(
        'Stripe checkout is only allowed from EN_ATTENTE_PAIEMENT status',
      );
    }

    const amount = Math.max(
      Number(reservation.depositAmount),
      Number(reservation.amountTtc),
    );

    const frontendBaseUrl = this.configService.get<string>(
      'FRONTEND_BASE_URL',
      'http://localhost:8080',
    );

    const session = await this.paymentsService.createCheckoutSession({
      title: `WestDrive - Reservation ${reservation.publicReference}`,
      description: `Paiement reservation ${reservation.publicReference}`,
      amount,
      currency: 'EUR',
      customerEmail: reservation.requesterEmail,
      successUrl: `${frontendBaseUrl.replace(/\/$/, '')}/checkout?flow=reservation&reservationId=${encodeURIComponent(reservation.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendBaseUrl.replace(/\/$/, '')}/checkout?flow=reservation&reservationId=${encodeURIComponent(reservation.id)}&payment=cancelled`,
      metadata: {
        targetType: 'reservation',
        reservationId: reservation.id,
        publicReference: reservation.publicReference,
      },
    });

    await this.appendSystemEvent(reservation.id, 'reservation_payment_session_created', {
      provider: 'STRIPE',
      sessionId: session.id,
      amount,
      currency: 'EUR',
    });

    if (!session.url) {
      throw new BadRequestException('Unable to create Stripe checkout URL');
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async createPaymentLink(
    reservationId: string,
  ): Promise<{ paymentLinkUrl: string }> {
    const reservation = await this.findOne(reservationId);

    if (reservation.status !== ReservationStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException(
        'Stripe payment link is only allowed from EN_ATTENTE_PAIEMENT status',
      );
    }

    const amount = Math.max(
      Number(reservation.depositAmount),
      Number(reservation.amountTtc),
    );

    const frontendBaseUrl = this.configService.get<string>(
      'FRONTEND_BASE_URL',
      'http://localhost:8080',
    );

    const paymentLinkUrl = await this.paymentsService.createPaymentLink({
      title: `WestDrive - Reservation ${reservation.publicReference}`,
      description: `Paiement reservation ${reservation.publicReference}`,
      amount,
      currency: 'EUR',
      customerEmail: reservation.requesterEmail,
      successUrl: `${frontendBaseUrl.replace(/\/$/, '')}/checkout?flow=reservation&reservationId=${encodeURIComponent(reservation.id)}&payment=success`,
      cancelUrl: `${frontendBaseUrl.replace(/\/$/, '')}/checkout?flow=reservation&reservationId=${encodeURIComponent(reservation.id)}&payment=cancelled`,
      metadata: {
        targetType: 'reservation',
        reservationId: reservation.id,
        publicReference: reservation.publicReference,
      },
    });

    await this.appendSystemEvent(reservation.id, 'reservation_payment_link_created', {
      provider: 'STRIPE',
      amount,
      currency: 'EUR',
    });

    return {
      paymentLinkUrl,
    };
  }

  async confirmPayment(
    reservationId: string,
    dto: ConfirmReservationPaymentDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(reservationId);

    if (reservation.status === ReservationStatus.CONFIRMEE) {
      return reservation;
    }

    const session = await this.paymentsService.retrieveCheckoutSession(dto.sessionId);
    const metadata = session.metadata ?? {};

    if (
      metadata.targetType !== 'reservation' ||
      metadata.reservationId !== reservation.id
    ) {
      throw new BadRequestException(
        'Stripe session does not match reservation',
      );
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Stripe session is not marked as paid');
    }

    await this.appendSystemEvent(reservation.id, 'reservation_payment_confirmed', {
      provider: 'STRIPE',
      sessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
      paymentStatus: session.payment_status,
    });

    await this.reservationRepository.update(
      { id: reservation.id },
      { status: ReservationStatus.CONFIRMEE },
    );

    await this.appendSystemEvent(reservation.id, 'reservation_status_changed', {
      status: ReservationStatus.CONFIRMEE,
    });

    try {
      if (reservation.userId) {
        await this.notificationsService.createForUser({
          type: 'reservation',
          title: 'Paiement confirme',
          message: `Votre reservation ${reservation.publicReference} est confirmee.`,
          recipientUserId: reservation.userId,
          metadata: {
            reservationId: reservation.id,
            publicReference: reservation.publicReference,
            status: ReservationStatus.CONFIRMEE,
          },
        });
      }

      await this.mailService.sendReservationPaymentConfirmedEmail({
        to: reservation.requesterEmail,
        requesterName: reservation.requesterName,
        publicReference: reservation.publicReference,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Payment confirmation email failed for reservation ${reservation.id}: ${reason}`,
      );
    }

    return this.findOne(reservation.id);
  }

  async createEvent(
    reservationId: string,
    dto: CreateReservationEventDto,
  ): Promise<ReservationEvent> {
    const reservation = await this.findOne(reservationId);

    // Operational timeline events can trigger safe status transitions automatically.
    if (dto.type === 'reservation_vehicle_handover') {
      if (reservation.status !== ReservationStatus.CONFIRMEE) {
        throw new BadRequestException(
          'Vehicle handover requires CONFIRMEE reservation status',
        );
      }
      reservation.status = ReservationStatus.EN_COURS;
      await this.reservationRepository.save(reservation);
      await this.appendSystemEvent(
        reservation.id,
        'reservation_status_changed',
        {
          status: reservation.status,
        },
      );
    }

    if (dto.type === 'reservation_closed') {
      if (reservation.status !== ReservationStatus.EN_COURS) {
        throw new BadRequestException(
          'Reservation can only be closed from EN_COURS status',
        );
      }
      reservation.status = ReservationStatus.CLOTUREE;
      await this.reservationRepository.save(reservation);
      await this.appendSystemEvent(
        reservation.id,
        'reservation_status_changed',
        {
          status: reservation.status,
        },
      );
    }

    const event = this.reservationEventRepository.create({
      reservationId,
      type: dto.type,
      occurredAt: dto.occurredAt ?? new Date(),
      payload: dto.payload ?? {},
    });

    const savedEvent = await this.reservationEventRepository.save(event);

    const shouldSendEmail =
      !!dto.payload &&
      typeof dto.payload === 'object' &&
      dto.payload !== null &&
      'sendEmail' in dto.payload &&
      dto.payload.sendEmail === true;

    if (shouldSendEmail) {
      const payload = dto.payload as Record<string, unknown>;
      const title =
        typeof payload.title === 'string' && payload.title.trim().length > 0
          ? payload.title
          : dto.type;
      const description =
        typeof payload.description === 'string' ? payload.description : undefined;

      try {
        await this.mailService.sendReservationEventNotification({
          to: reservation.requesterEmail,
          requesterName: reservation.requesterName,
          publicReference: reservation.publicReference,
          title,
          description,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown reason';
        this.logger.warn(
          `Custom event email failed for reservation ${reservation.id}: ${reason}`,
        );
      }
    }

    const isVisibleClient =
      !!dto.payload &&
      typeof dto.payload === 'object' &&
      dto.payload !== null &&
      'visibleClient' in dto.payload &&
      dto.payload.visibleClient !== false;

    if (reservation.userId && isVisibleClient) {
      const payload = dto.payload as Record<string, unknown>;
      const title =
        typeof payload?.title === 'string' && payload.title.trim().length > 0
          ? payload.title
          : 'Nouvel evenement de reservation';
      const description =
        typeof payload?.description === 'string' && payload.description.trim().length > 0
          ? payload.description
          : `Un nouvel evenement a ete ajoute pour ${reservation.publicReference}.`;

      await this.notificationsService.createForUser({
        type: 'reservation',
        title,
        message: description,
        recipientUserId: reservation.userId,
        metadata: {
          reservationId: reservation.id,
          publicReference: reservation.publicReference,
          eventType: dto.type,
        },
      });
    }

    return savedEvent;
  }

  async findEvents(
    reservationId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<ReservationEvent>> {
    await this.findOne(reservationId);

    const pagination = resolvePagination(page, limit);

    const [items, totalItems] = await this.reservationEventRepository.findAndCount({
      where: { reservationId },
      order: { occurredAt: 'ASC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return buildPaginatedResponse(
      items,
      pagination.page,
      pagination.limit,
      totalItems,
    );
  }

  async remove(id: string): Promise<{ message: string }> {
    const reservation = await this.reservationRepository.findOne({ where: { id } });

    if (!reservation || reservation.archivedAt) {
      throw new NotFoundException('Reservation not found');
    }

    reservation.archivedAt = new Date();
    await this.reservationRepository.save(reservation);

    await this.appendSystemEvent(reservation.id, 'reservation_archived', {
      status: reservation.status,
    });

    return { message: 'Reservation archived successfully' };
  }

  private async ensureVehicleAssignable(vehicleId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (!vehicle.isActive) {
      throw new BadRequestException('Vehicle is inactive');
    }

    // Maintenance or blocked vehicles cannot be used for new bookings.
    if (
      vehicle.operationalStatus === VehicleOperationalStatus.INDISPONIBLE ||
      vehicle.operationalStatus === VehicleOperationalStatus.MAINTENANCE
    ) {
      throw new BadRequestException(
        'Vehicle is not assignable in current status',
      );
    }
  }

  private async ensureNoVehicleOverlap(
    vehicleId: string,
    startAt: Date,
    endAt: Date,
    excludedReservationId?: string,
  ): Promise<void> {
    const blockedSlotCount = await this.slotRepository
      .createQueryBuilder('slot')
      .where('slot.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('(slot.start_at < :endAt) AND (slot.end_at > :startAt)', {
        startAt,
        endAt,
      })
      .getCount();

    if (blockedSlotCount > 0) {
      throw new ConflictException(
        'Vehicle is blocked by schedule slot for the selected range',
      );
    }

    const conflictingCount = await this.reservationRepository.count({
      where: {
        vehicleId,
        status: In(BLOCKING_STATUSES),
        archivedAt: IsNull(),
        id: excludedReservationId ? Not(excludedReservationId) : undefined,
      },
    });

    if (!conflictingCount) {
      return;
    }

    const conflicts = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('reservation.status IN (:...blockingStatuses)', {
        blockingStatuses: BLOCKING_STATUSES,
      })
      .andWhere(
        '(reservation.start_at < :endAt) AND (reservation.end_at > :startAt)',
        {
          startAt,
          endAt,
        },
      )
      .andWhere(
        excludedReservationId
          ? 'reservation.id != :excludedReservationId'
          : '1=1',
        { excludedReservationId },
      )
      .getCount();

    if (conflicts > 0) {
      throw new ConflictException(
        'Vehicle already has an overlapping reservation for this time range',
      );
    }
  }

  private ensureDateRange(startAt: Date, endAt: Date): void {
    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }

    if (startAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('startAt must be in the future');
    }
  }

  private generatePublicReference(): string {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `RES-${date}-${random}`;
  }

  private async appendSystemEvent(
    reservationId: string,
    type: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.reservationEventRepository.save(
      this.reservationEventRepository.create({
        reservationId,
        type,
        occurredAt: new Date(),
        payload,
      }),
    );
  }
}
