import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
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

    // ── Staff/admin guard ─────────────────────────────────────────────────────
    // If the email belongs to an existing non-client account, block creation.
    const CLIENT_ROLES = new Set(['client', 'customer', 'particulier']);

    if (!dto.userId) {
      const existingUser = await this.usersService.findByEmail(requesterEmail);
      if (existingUser) {
        if (!CLIENT_ROLES.has(existingUser.role?.toLowerCase() ?? '')) {
          throw new ForbiddenException(
            'Les comptes administrateurs et membres du personnel ne peuvent pas effectuer de r\u00e9servations sur la plateforme.',
          );
        }
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
    } else {
      // Authenticated user — verify they are not staff/admin.
      const authenticatedUser = await this.usersService.findById(dto.userId);
      if (authenticatedUser && !CLIENT_ROLES.has(authenticatedUser.role?.toLowerCase() ?? '')) {
        throw new ForbiddenException(
          'Les comptes administrateurs et membres du personnel ne peuvent pas effectuer de r\u00e9servations sur la plateforme.',
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

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
      status: ReservationStatus.EN_ATTENTE_PAIEMENT,
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
      // Load vehicle for email enrichment
      const vehicleForEmail = savedReservation.vehicleId
        ? await this.vehicleRepository.findOne({ where: { id: savedReservation.vehicleId } })
        : null;

      const frontendBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL', 'http://localhost:8080');

      await this.mailService.sendReservationAcknowledgement({
        to: savedReservation.requesterEmail,
        requesterName: savedReservation.requesterName,
        publicReference: savedReservation.publicReference,
        vehicleName: vehicleForEmail?.name,
        startAt: savedReservation.startAt?.toISOString(),
        endAt: savedReservation.endAt?.toISOString(),
        pickupCity: savedReservation.pickupCity,
        amountTtc: Number(savedReservation.amountTtc) || undefined,
        requesterPhone: savedReservation.requesterPhone,
        requesterType: savedReservation.requesterType,
        companyName: savedReservation.companyName ?? undefined,
      });

      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        await this.mailService.sendReservationAdminNotification({
          to: adminEmail,
          requesterName: savedReservation.requesterName,
          requesterEmail: savedReservation.requesterEmail,
          publicReference: savedReservation.publicReference,
          vehicleName: vehicleForEmail?.name,
          startAt: savedReservation.startAt?.toISOString(),
          endAt: savedReservation.endAt?.toISOString(),
          pickupCity: savedReservation.pickupCity,
          amountTtc: Number(savedReservation.amountTtc) || undefined,
          requesterPhone: savedReservation.requesterPhone,
          requesterType: savedReservation.requesterType,
          companyName: savedReservation.companyName ?? undefined,
          backofficeUrl: `${frontendBaseUrl.replace(/\/$/, '')}/boss`,
        });
      }

      await this.notificationsService.createForAdmin({
        type: 'reservation',
        title: 'Nouvelle reservation en attente de paiement',
        message: `${savedReservation.requesterName} a initie la reservation ${savedReservation.publicReference}.`,
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
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Reservation ${savedReservation.id} created but notification pipeline partially failed: ${reason}`,
      );
    }

    // Guest activation email runs in its own isolated block to ensure it is always
    // attempted regardless of failures in the main notification pipeline above.
    if (shouldSendGuestSetupEmail) {
      try {
        const setupUrl = await this.authService.createAccountActivationUrl(
          savedReservation.requesterEmail,
          {
            invitationSource: 'reservation',
            redirectPath: '/connexion',
            ttlMinutes: 60 * 24,
          },
        );
        if (setupUrl) {
          await this.mailService.sendGuestAccountSetupEmail({
            to: savedReservation.requesterEmail,
            requesterName: savedReservation.requesterName,
            publicReference: savedReservation.publicReference,
            setupUrl,
          });
        } else {
          this.logger.warn(
            `Guest setup URL could not be generated for ${savedReservation.requesterEmail} — user may not exist in DB`,
          );
        }
      } catch (guestEmailError) {
        const reason =
          guestEmailError instanceof Error ? guestEmailError.message : 'unknown';
        this.logger.warn(
          `Guest account setup email failed for ${savedReservation.requesterEmail}: ${reason}`,
        );
      }
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

  async findMine(
    userId: string,
    requesterEmail: string | undefined,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Reservation>> {
    const pagination = resolvePagination(page, limit);
    const normalizedUserId =
      typeof userId === 'string' && userId.trim().length > 0
        ? userId.trim()
        : null;
    const normalizedEmail =
      typeof requesterEmail === 'string' && requesterEmail.trim().length > 0
        ? requesterEmail.trim().toLowerCase()
        : null;

    if (!normalizedUserId && !normalizedEmail) {
      this.logger.warn(
        'findMine called without exploitable identity (missing userId and requesterEmail in JWT payload)',
      );
      return buildPaginatedResponse([], pagination.page, pagination.limit, 0);
    }

    try {
      const query = this.reservationRepository
        .createQueryBuilder('r')
        .where('r.archivedAt IS NULL')
        .leftJoinAndSelect('r.vehicle', 'vehicle')
        .leftJoinAndSelect('r.user', 'user')
        .orderBy('r.createdAt', 'DESC')
        .skip(pagination.skip)
        .take(pagination.limit);

      if (normalizedUserId && normalizedEmail) {
        query.andWhere('(r.userId = :userId OR LOWER(r.requesterEmail) = :email)', {
          userId: normalizedUserId,
          email: normalizedEmail,
        });
      } else if (normalizedUserId) {
        query.andWhere('r.userId = :userId', { userId: normalizedUserId });
      } else {
        query.andWhere('LOWER(r.requesterEmail) = :email', {
          email: normalizedEmail,
        });
      }

      const [items, totalItems] = await query.getManyAndCount();

      return buildPaginatedResponse(
        items,
        pagination.page,
        pagination.limit,
        totalItems,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.error(
        `findMine failed (userId=${normalizedUserId ?? 'null'}, email=${normalizedEmail ?? 'null'}, page=${pagination.page}, limit=${pagination.limit}): ${reason}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Impossible de charger vos reservations pour le moment.',
      );
    }
  }

  async findEventsForCustomer(
    reservationId: string,
    userId: string,
    requesterEmail: string | undefined,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<ReservationEvent>> {
    const normalizedUserId =
      typeof userId === 'string' && userId.trim().length > 0
        ? userId.trim()
        : null;
    const normalizedEmail =
      typeof requesterEmail === 'string' && requesterEmail.trim().length > 0
        ? requesterEmail.trim().toLowerCase()
        : null;

    if (!normalizedUserId && !normalizedEmail) {
      this.logger.warn(
        `findEventsForCustomer called without identity for reservation ${reservationId}`,
      );
      throw new NotFoundException('Reservation not found');
    }

    let reservation: Reservation | null = null;
    try {
      const reservationQuery = this.reservationRepository
        .createQueryBuilder('r')
        .where('r.id = :reservationId', { reservationId })
        .andWhere('r.archivedAt IS NULL');

      if (normalizedUserId && normalizedEmail) {
        reservationQuery.andWhere(
          '(r.userId = :userId OR LOWER(r.requesterEmail) = :email)',
          {
            userId: normalizedUserId,
            email: normalizedEmail,
          },
        );
      } else if (normalizedUserId) {
        reservationQuery.andWhere('r.userId = :userId', {
          userId: normalizedUserId,
        });
      } else {
        reservationQuery.andWhere('LOWER(r.requesterEmail) = :email', {
          email: normalizedEmail,
        });
      }

      reservation = await reservationQuery.getOne();
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.error(
        `findEventsForCustomer ownership check failed (reservationId=${reservationId}, userId=${normalizedUserId ?? 'null'}, email=${normalizedEmail ?? 'null'}): ${reason}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Impossible de charger la timeline de cette reservation.',
      );
    }

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return this.findEvents(reservation.id, page, limit);
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

    this.ensureDateRange(nextStartAt, nextEndAt, true /* admin update — past dates allowed */);

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

    const hasDateChange =
      dto.startAt !== undefined ||
      dto.endAt !== undefined ||
      dto.vehicleId !== undefined;

    await this.reservationEventRepository.save(
      this.reservationEventRepository.create({
        reservationId: reservation.id,
        type: 'reservation_updated',
        occurredAt: new Date(),
        payload: { hasDateChange, updatedBy: 'admin' },
      }),
    );

    // Notify client about the admin update
    if (reservation.userId) {
      try {
        await this.notificationsService.createForUser({
          type: 'reservation',
          title: 'Réservation modifiée',
          message: `Les détails de votre réservation ${reservation.publicReference} ont été mis à jour par notre équipe.`,
          recipientUserId: reservation.userId,
          metadata: {
            reservationId: reservation.id,
            publicReference: reservation.publicReference,
          },
        });
      } catch (notifError) {
        const reason =
          notifError instanceof Error ? notifError.message : 'unknown';
        this.logger.warn(
          `Notification failed for reservation update ${reservation.id}: ${reason}`,
        );
      }
    }

    // Send email notification to client
    try {
      await this.mailService.sendReservationEventNotification({
        to: reservation.requesterEmail,
        requesterName: reservation.requesterName,
        publicReference: reservation.publicReference,
        title: 'Votre réservation a été mise à jour',
        description: hasDateChange
          ? 'Les dates ou le véhicule de votre réservation ont été modifiés. Connectez-vous à votre espace client pour consulter les nouveaux détails.'
          : 'Les informations de votre réservation ont été mises à jour. Connectez-vous à votre espace client pour consulter les détails.',
      });
    } catch (mailError) {
      const reason =
        mailError instanceof Error ? mailError.message : 'unknown';
      this.logger.warn(
        `Email notification failed for reservation update ${reservation.id}: ${reason}`,
      );
    }

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

  async confirmFromQuoteConversion(id: string): Promise<void> {
    await this.reservationRepository.update({ id }, { status: ReservationStatus.CONFIRMEE });
    await this.appendSystemEvent(id, 'reservation_confirmed_from_quote', {
      source: 'quote_auto_conversion',
    });
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
    const reservation = await this.ensureReservationReadyForPayment(reservationId);
    const amount = this.calculatePaymentDueAmount(reservation);

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

    try {
      await this.mailService.sendReservationPaymentLinkEmail({
        to: reservation.requesterEmail,
        requesterName: reservation.requesterName,
        publicReference: reservation.publicReference,
        paymentUrl: session.url,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Payment link email failed for reservation ${reservation.id}: ${reason}`,
      );
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async createPaymentLink(
    reservationId: string,
  ): Promise<{ paymentLinkUrl: string }> {
    const reservation = await this.ensureReservationReadyForPayment(reservationId);
    const amount = this.calculatePaymentDueAmount(reservation);

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

    try {
      await this.mailService.sendReservationPaymentLinkEmail({
        to: reservation.requesterEmail,
        requesterName: reservation.requesterName,
        publicReference: reservation.publicReference,
        paymentUrl: paymentLinkUrl,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Payment link email failed for reservation ${reservation.id}: ${reason}`,
      );
    }

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
        vehicleName: reservation.vehicle?.name,
        startAt: reservation.startAt?.toISOString(),
        endAt: reservation.endAt?.toISOString(),
        pickupCity: reservation.pickupCity,
        amountTtc: Number(reservation.amountTtc) || undefined,
        depositAmount: Number(reservation.depositAmount) || undefined,
        espaceUrl: `${this.configService.get<string>('FRONTEND_BASE_URL', 'http://localhost:8080').replace(/\/$/, '')}/espace`,
      });

      // Admin notification: payment received
      const adminEmailForPayment = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmailForPayment) {
        await this.mailService.sendReservationPaymentAdminNotification({
          to: adminEmailForPayment,
          publicReference: reservation.publicReference,
          requesterName: reservation.requesterName,
          requesterEmail: reservation.requesterEmail,
          amountTtc: Number(reservation.amountTtc) || 0,
          vehicleName: reservation.vehicle?.name,
          startAt: reservation.startAt?.toISOString(),
          endAt: reservation.endAt?.toISOString(),
          backofficeUrl: `${this.configService.get<string>('FRONTEND_BASE_URL', 'http://localhost:8080').replace(/\/$/, '')}/boss`,
        });
      }
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

      // Update vehicle availability and starting mileage
      if (reservation.vehicleId) {
        const kmStart =
          typeof dto.payload?.kmStart === 'number' ? dto.payload.kmStart : undefined;
        await this.vehicleRepository.update(
          { id: reservation.vehicleId },
          {
            operationalStatus: VehicleOperationalStatus.INDISPONIBLE,
            ...(kmStart !== undefined ? { mileage: kmStart } : {}),
          },
        );
      }
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

      // Restore vehicle availability and update ending mileage
      if (reservation.vehicleId) {
        const kmEnd =
          typeof dto.payload?.kmEnd === 'number' ? dto.payload.kmEnd : undefined;
        const vehicleToRestore = await this.vehicleRepository.findOne({
          where: { id: reservation.vehicleId },
        });
        if (vehicleToRestore) {
          const isInMaintenance =
            vehicleToRestore.operationalStatus === VehicleOperationalStatus.MAINTENANCE;
          await this.vehicleRepository.update(
            { id: reservation.vehicleId },
            {
              ...(!isInMaintenance
                ? { operationalStatus: VehicleOperationalStatus.DISPONIBLE }
                : {}),
              ...(kmEnd !== undefined ? { mileage: kmEnd } : {}),
            },
          );
        }
      }
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

      const rawPhotos = Array.isArray(payload.photos) ? payload.photos : [];
      const photos = rawPhotos
        .filter(
          (p): p is { filename: string; content: string } =>
            typeof p === 'object' &&
            p !== null &&
            typeof (p as Record<string, unknown>).filename === 'string' &&
            typeof (p as Record<string, unknown>).content === 'string',
        );

      try {
        await this.mailService.sendReservationEventNotification({
          to: reservation.requesterEmail,
          requesterName: reservation.requesterName,
          publicReference: reservation.publicReference,
          title,
          description,
          ...(photos.length > 0 ? { photos } : {}),
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
      throw new BadRequestException('Ce véhicule est désactivé et ne peut pas être assigné.');
    }

    // Maintenance or blocked vehicles cannot be used for new bookings.
    if (
      vehicle.operationalStatus === VehicleOperationalStatus.INDISPONIBLE ||
      vehicle.operationalStatus === VehicleOperationalStatus.MAINTENANCE
    ) {
      throw new BadRequestException(
        'Ce véhicule est actuellement indisponible ou en maintenance.',
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
        'Ce véhicule est bloqué par un créneau dans la plage de dates sélectionnée.',
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
        'Ce véhicule a déjà une réservation pour cette plage de dates. Veuillez choisir d\'autres dates ou un autre véhicule.',
      );
    }
  }

  private ensureDateRange(startAt: Date, endAt: Date, allowPast = false): void {
    if (startAt >= endAt) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin.',
      );
    }

    if (!allowPast && startAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException(
        'La date de début ne peut pas être dans le passé.',
      );
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

  private async ensureReservationReadyForPayment(
    reservationId: string,
  ): Promise<Reservation> {
    const reservation = await this.findOne(reservationId);

    const allowedStatuses = new Set<ReservationStatus>([
      ReservationStatus.NOUVELLE_DEMANDE,
      ReservationStatus.EN_ANALYSE,
      ReservationStatus.PROPOSITION_ENVOYEE,
      ReservationStatus.EN_ATTENTE_PAIEMENT,
    ]);

    if (!allowedStatuses.has(reservation.status)) {
      throw new BadRequestException(
        'Stripe payment link is not allowed from current reservation status',
      );
    }

    if (reservation.status !== ReservationStatus.EN_ATTENTE_PAIEMENT) {
      reservation.status = ReservationStatus.EN_ATTENTE_PAIEMENT;
      await this.reservationRepository.save(reservation);

      await this.appendSystemEvent(reservation.id, 'reservation_status_changed', {
        status: ReservationStatus.EN_ATTENTE_PAIEMENT,
        source: 'auto_payment_ready',
      });

      await this.appendSystemEvent(
        reservation.id,
        STATUS_EVENT_MAP[ReservationStatus.EN_ATTENTE_PAIEMENT],
        {
          status: ReservationStatus.EN_ATTENTE_PAIEMENT,
          source: 'auto_payment_ready',
        },
      );
    }

    return reservation;
  }

  private calculatePaymentDueAmount(reservation: Reservation): number {
    const rentalAmount = Number(reservation.amountTtc);
    const normalizedRental = Number.isFinite(rentalAmount) && rentalAmount > 0 ? rentalAmount : 0;
    // The deposit (caution) is collected physically at vehicle handover — never charged via Stripe.
    return normalizedRental;
  }
}
