import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReservationDto } from '../reservations/dto/create-reservation.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { MailService } from '../shared/mail/mail.service';
import { PaymentsService } from '../shared/payments/payments.service';
import {
  buildPaginatedResponse,
  resolvePagination,
  type PaginatedResponse,
} from '../shared/pagination/pagination.util';
import { ConfirmQuotePaymentDto } from './dto/confirm-quote-payment.dto';
import { ConvertQuoteToReservationDto } from './dto/convert-quote-to-reservation.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import {
  CustomerQuoteResponseAction,
  CustomerQuoteResponseDto,
} from './dto/customer-quote-response.dto';
import { SendQuoteProposalDto } from './dto/send-quote-proposal.dto';
import { StartQuoteAnalysisDto } from './dto/start-quote-analysis.dto';
import { StartQuoteNegotiationDto } from './dto/start-quote-negotiation.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuoteEvent } from './entities/quote-event.entity';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { UsersService } from '../users/users.service';

const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.NOUVELLE_DEMANDE]: [
    QuoteStatus.EN_ANALYSE,
    QuoteStatus.REFUSEE,
    QuoteStatus.ANNULEE,
  ],
  [QuoteStatus.EN_ANALYSE]: [
    QuoteStatus.PROPOSITION_ENVOYEE,
    QuoteStatus.EN_NEGOCIATION,
    QuoteStatus.EN_ATTENTE_PAIEMENT,
    QuoteStatus.REFUSEE,
    QuoteStatus.ANNULEE,
  ],
  [QuoteStatus.PROPOSITION_ENVOYEE]: [
    QuoteStatus.EN_NEGOCIATION,
    QuoteStatus.EN_ATTENTE_PAIEMENT,
    QuoteStatus.REFUSEE,
    QuoteStatus.ANNULEE,
  ],
  [QuoteStatus.EN_NEGOCIATION]: [
    QuoteStatus.PROPOSITION_ENVOYEE,
    QuoteStatus.EN_ATTENTE_PAIEMENT,
    QuoteStatus.REFUSEE,
    QuoteStatus.ANNULEE,
  ],
  [QuoteStatus.EN_ATTENTE_PAIEMENT]: [
    QuoteStatus.PAYEE,
    QuoteStatus.EN_NEGOCIATION,
    QuoteStatus.REFUSEE,
    QuoteStatus.ANNULEE,
  ],
  [QuoteStatus.PAYEE]: [QuoteStatus.CONVERTI_RESERVATION],
  [QuoteStatus.CONVERTI_RESERVATION]: [],
  [QuoteStatus.REFUSEE]: [],
  [QuoteStatus.ANNULEE]: [],
};

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteEvent)
    private readonly quoteEventRepository: Repository<QuoteEvent>,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly notificationsService: NotificationsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  async create(dto: CreateQuoteDto): Promise<Quote> {
    this.ensureDateRange(dto.startAt, dto.endAt);

    const requesterEmail = dto.requesterEmail.toLowerCase();
    const existingUser = await this.usersService.findByEmail(requesterEmail);

    // Staff/admin accounts cannot submit quote requests.
    if (existingUser) {
      const CLIENT_ROLES = new Set(['client', 'customer', 'particulier']);
      if (!CLIENT_ROLES.has(existingUser.role?.toLowerCase() ?? '')) {
        throw new ForbiddenException(
          'Les comptes administrateurs et membres du personnel ne peuvent pas effectuer de demandes de devis sur la plateforme.',
        );
      }
    }

    const shouldSendGuestActivationEmail = !existingUser;

    if (!existingUser) {
      await this.usersService.createGuestAccount({
        email: requesterEmail,
        requesterName: dto.requesterName,
        phone: dto.requesterPhone,
      });
    }

    const quote = this.quoteRepository.create({
      publicReference: this.generatePublicReference(),
      requesterType: dto.requesterType,
      requesterName: dto.requesterName,
      requesterEmail,
      requesterPhone: dto.requesterPhone,
      companyName: dto.companyName ?? null,
      companySiret: dto.companySiret ?? null,
      pickupCity: dto.pickupCity,
      requestedVehicleType: dto.requestedVehicleType,
      requestedQuantity: dto.requestedQuantity,
      startAt: dto.startAt,
      endAt: dto.endAt,
      comment: dto.comment ?? null,
      status: QuoteStatus.NOUVELLE_DEMANDE,
      amountTtc: '0.00',
      currency: 'EUR',
      paymentSessionId: null,
      paymentIntentId: null,
      paymentPaidAt: null,
      proposalDetails: null,
      proposalMessage: null,
      userId: existingUser?.id ?? null,
      archivedAt: null,
    });

    const savedQuote = await this.quoteRepository.save(quote);

    await this.appendSystemEvent(savedQuote.id, 'quote_created', {
      status: QuoteStatus.NOUVELLE_DEMANDE,
      requesterType: savedQuote.requesterType,
      requestedVehicleType: savedQuote.requestedVehicleType,
      requestedQuantity: savedQuote.requestedQuantity,
    });

    try {
      await this.mailService.sendQuoteRequestAcknowledgement({
        to: savedQuote.requesterEmail,
        requesterName: savedQuote.requesterName,
        publicReference: savedQuote.publicReference,
        vehicleType: savedQuote.requestedVehicleType,
        quantity: savedQuote.requestedQuantity,
        startAt: savedQuote.startAt.toISOString(),
        endAt: savedQuote.endAt.toISOString(),
        pickupCity: savedQuote.pickupCity,
        comment: savedQuote.comment,
      });

      await this.appendSystemEvent(savedQuote.id, 'quote_ack_email_sent', {});

      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        await this.mailService.sendQuoteAdminNotification({
          to: adminEmail,
          requesterName: savedQuote.requesterName,
          requesterEmail: savedQuote.requesterEmail,
          requesterPhone: savedQuote.requesterPhone,
          publicReference: savedQuote.publicReference,
          requesterType: savedQuote.requesterType,
          companyName: savedQuote.companyName,
          vehicleType: savedQuote.requestedVehicleType,
          quantity: savedQuote.requestedQuantity,
          pickupCity: savedQuote.pickupCity,
          startAt: savedQuote.startAt.toISOString(),
          endAt: savedQuote.endAt.toISOString(),
          comment: savedQuote.comment,
          backofficeUrl: this.configService.get<string>('FRONTEND_BASE_URL', 'http://localhost:8080') + '/boss',
        });

        await this.appendSystemEvent(savedQuote.id, 'quote_admin_notified', {
          channel: 'email',
        });
      }

      await this.notificationsService.createForAdmin({
        type: 'devis',
        title: 'Nouveau devis',
        message: `Nouveau devis ${savedQuote.publicReference} recu.`,
        metadata: {
          quoteId: savedQuote.id,
          publicReference: savedQuote.publicReference,
          status: savedQuote.status,
        },
      });

      if (savedQuote.userId) {
        await this.notificationsService.createForUser({
          type: 'devis',
          title: 'Demande de devis enregistree',
          message: `Votre demande de devis ${savedQuote.publicReference} a bien ete recue. Notre equipe vous recontacte rapidement.`,
          recipientUserId: savedQuote.userId,
          metadata: {
            quoteId: savedQuote.id,
            publicReference: savedQuote.publicReference,
            status: savedQuote.status,
          },
        });
      }

      if (shouldSendGuestActivationEmail) {
        const activationUrl = await this.authService.createAccountActivationUrl(
          savedQuote.requesterEmail,
          {
            invitationSource: 'quote',
            redirectPath: '/connexion',
            ttlMinutes: 60 * 24,
          },
        );

        if (activationUrl) {
          await this.mailService.sendQuoteGuestActivationEmail({
            to: savedQuote.requesterEmail,
            requesterName: savedQuote.requesterName,
            publicReference: savedQuote.publicReference,
            activationUrl,
          });
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Quote ${savedQuote.id} created but email pipeline partially failed: ${reason}`,
      );
    }

    return savedQuote;
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Quote>> {
    const pagination = resolvePagination(page, limit);
    const [items, totalItems] = await this.quoteRepository.findAndCount({
      where: { archivedAt: IsNull() },
      order: { createdAt: 'DESC' },
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

  async findMine(
    requesterEmail: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Quote>> {
    const pagination = resolvePagination(page, limit);
    const [items, totalItems] = await this.quoteRepository.findAndCount({
      where: {
        archivedAt: IsNull(),
        requesterEmail: requesterEmail.toLowerCase(),
      },
      order: { createdAt: 'DESC' },
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

  async findMineForUser(
    userId: string,
    requesterEmail?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Quote>> {
    const resolvedEmail = await this.resolveRequesterEmail(userId, requesterEmail);
    if (!resolvedEmail) {
      this.logger.warn(
        `findMineForUser called without exploitable identity (userId=${userId || 'null'}, email=${requesterEmail || 'null'})`,
      );
      return buildPaginatedResponse([], page, limit, 0);
    }

    try {
      return this.findMine(resolvedEmail, page, limit);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.error(
        `findMineForUser failed (userId=${userId || 'null'}, email=${resolvedEmail}, page=${page}, limit=${limit}): ${reason}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Impossible de charger vos devis pour le moment.',
      );
    }
  }

  async findOne(id: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id, archivedAt: IsNull() },
      relations: { events: true },
      order: { events: { occurredAt: 'ASC' } },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async updateStatus(id: string, dto: UpdateQuoteStatusDto): Promise<Quote> {
    const quote = await this.findOne(id);

    if (quote.status === dto.status) {
      return quote;
    }

    this.ensureTransition(quote.status, dto.status);

    quote.status = dto.status;
    const saved = await this.quoteRepository.save(quote);

    await this.appendSystemEvent(saved.id, 'quote_status_changed', {
      status: dto.status,
      comment: dto.comment ?? null,
    });

    if (dto.status === QuoteStatus.EN_ANALYSE) {
      await this.appendSystemEvent(saved.id, 'quote_in_analysis', {
        comment: dto.comment ?? null,
      });
    }

    if (dto.status === QuoteStatus.REFUSEE) {
      await this.appendSystemEvent(saved.id, 'quote_refused', {
        reason: dto.comment ?? null,
      });
      try {
        await this.mailService.sendQuoteRejectedEmail({
          to: saved.requesterEmail,
          requesterName: saved.requesterName,
          publicReference: saved.publicReference,
          message: dto.comment,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown reason';
        this.logger.warn(
          `Quote rejection email failed for quote ${saved.id}: ${reason}`,
        );
      }
    }

    await this.notifyAdmin(
      'Mise a jour devis',
      `Le devis ${saved.publicReference} est passe au statut ${saved.status}.`,
      saved,
    );

    return saved;
  }

  async startAnalysis(id: string, dto: StartQuoteAnalysisDto): Promise<Quote> {
    const quote = await this.findOne(id);

    if (quote.status === QuoteStatus.EN_ANALYSE) {
      return quote;
    }

    this.ensureTransition(quote.status, QuoteStatus.EN_ANALYSE);
    quote.status = QuoteStatus.EN_ANALYSE;
    const saved = await this.quoteRepository.save(quote);

    await this.appendSystemEvent(saved.id, 'quote_in_analysis', {
      comment: dto.comment ?? null,
    });

    try {
      await this.mailService.sendQuoteAnalysisStartedEmail({
        to: saved.requesterEmail,
        requesterName: saved.requesterName,
        publicReference: saved.publicReference,
        comment: dto.comment,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Quote analysis email failed for quote ${saved.id}: ${reason}`,
      );
    }

    await this.notifyAdmin(
      'Devis en analyse',
      `Le devis ${saved.publicReference} est en analyse.`,
      saved,
    );

    return saved;
  }

  async startNegotiation(
    id: string,
    dto: StartQuoteNegotiationDto,
  ): Promise<Quote> {
    const quote = await this.findOne(id);

    if (quote.status === QuoteStatus.EN_NEGOCIATION) {
      return quote;
    }

    this.ensureTransition(quote.status, QuoteStatus.EN_NEGOCIATION);
    quote.status = QuoteStatus.EN_NEGOCIATION;
    const saved = await this.quoteRepository.save(quote);

    await this.appendSystemEvent(saved.id, 'quote_negotiation_updated', {
      message: dto.message ?? null,
    });

    try {
      await this.mailService.sendQuoteNegotiationUpdatedEmail({
        to: saved.requesterEmail,
        requesterName: saved.requesterName,
        publicReference: saved.publicReference,
        message: dto.message,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Quote negotiation email failed for quote ${saved.id}: ${reason}`,
      );
    }

    await this.notifyAdmin(
      'Devis en negociation',
      `Le devis ${saved.publicReference} est passe en negociation.`,
      saved,
    );

    return saved;
  }

  async sendProposal(
    id: string,
    dto: SendQuoteProposalDto,
  ): Promise<{ quote: Quote }> {
    const quote = await this.findOne(id);

    if (
      ![
        QuoteStatus.EN_ANALYSE,
        QuoteStatus.EN_NEGOCIATION,
        QuoteStatus.PROPOSITION_ENVOYEE,
      ].includes(quote.status)
    ) {
      throw new BadRequestException(
        `Cannot send proposal for quote in ${quote.status} status`,
      );
    }

    quote.amountTtc = dto.amountTtc.toFixed(2);
    quote.currency = (dto.currency ?? 'EUR').toUpperCase();
    if (quote.status !== QuoteStatus.PROPOSITION_ENVOYEE) {
      this.ensureTransition(quote.status, QuoteStatus.PROPOSITION_ENVOYEE);
    }
    quote.status = QuoteStatus.PROPOSITION_ENVOYEE;
    quote.proposalDetails = dto.proposalDetails ?? null;
    quote.proposalMessage = dto.message ?? null;

    const savedQuote = await this.quoteRepository.save(quote);

    try {
      await this.mailService.sendQuoteProposalEmail({
        to: savedQuote.requesterEmail,
        requesterName: savedQuote.requesterName,
        publicReference: savedQuote.publicReference,
        amountTtc: dto.amountTtc,
        currency: savedQuote.currency,
        message: dto.message,
        propositions: (dto.proposalDetails as { propositions?: Array<{
          typeVehicule: string;
          dateDebut: string;
          heureDebut: string;
          dateFin: string;
          heureFin: string;
          kmInclus: string | number;
          prixJour: string | number;
          prixHeure?: string | number;
        }> } | null)?.propositions,
      });

      await this.appendSystemEvent(savedQuote.id, 'quote_proposal_sent', {
        amountTtc: dto.amountTtc,
        currency: savedQuote.currency,
        message: dto.message ?? null,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Quote proposal email failed for quote ${savedQuote.id}: ${reason}`,
      );
    }

    if (savedQuote.userId) {
      try {
        await this.notificationsService.createForUser({
          type: 'devis',
          title: 'Proposition de devis',
          message: `West Drive vous a envoye une proposition pour le devis ${savedQuote.publicReference}.`,
          recipientUserId: savedQuote.userId,
          metadata: {
            quoteId: savedQuote.id,
            publicReference: savedQuote.publicReference,
            status: savedQuote.status,
          },
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown reason';
        this.logger.warn(
          `Quote proposal user notification failed for quote ${savedQuote.id}: ${reason}`,
        );
      }
    }

    await this.notifyAdmin(
      'Proposition devis envoyee',
      `Une proposition a ete envoyee pour le devis ${savedQuote.publicReference}.`,
      savedQuote,
    );

    return { quote: savedQuote };
  }

  async createPaymentSession(
    id: string,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    const quote = await this.findOne(id);

    if (quote.status !== QuoteStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException(
        'Payment session can only be generated for EN_ATTENTE_PAIEMENT quote',
      );
    }

    const amount = Number(quote.amountTtc);
    const session = await this.createQuoteCheckoutSession(
      quote,
      amount,
      quote.currency,
    );

    quote.paymentSessionId = session.id;
    quote.paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    await this.quoteRepository.save(quote);

    if (!session.url) {
      throw new BadRequestException('Unable to create Stripe checkout URL');
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async createPaymentLink(id: string): Promise<{ paymentLinkUrl: string }> {
    const quote = await this.findOne(id);

    if (quote.status !== QuoteStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException(
        'Payment link can only be generated for EN_ATTENTE_PAIEMENT quote',
      );
    }

    const amount = Number(quote.amountTtc);
    const paymentLinkUrl = await this.createQuotePaymentLink(
      quote,
      amount,
      quote.currency,
    );

    await this.appendSystemEvent(quote.id, 'quote_payment_link_created', {
      paymentLinkUrl,
    });

    return {
      paymentLinkUrl,
    };
  }

  async confirmPayment(
    quoteId: string,
    dto: ConfirmQuotePaymentDto,
  ): Promise<Quote> {
    const quote = await this.findOne(quoteId);

    if (quote.status === QuoteStatus.PAYEE) {
      return quote;
    }

    if (quote.status !== QuoteStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException(
        `Cannot confirm payment for quote in ${quote.status} status`,
      );
    }

    const session = await this.paymentsService.retrieveCheckoutSession(dto.sessionId);
    const metadata = session.metadata ?? {};

    if (metadata.targetType !== 'quote' || metadata.quoteId !== quote.id) {
      throw new BadRequestException('Checkout session does not match quote');
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Stripe session is not marked as paid');
    }

    this.ensureTransition(quote.status, QuoteStatus.PAYEE);
    quote.status = QuoteStatus.PAYEE;
    quote.paymentSessionId = session.id;
    quote.paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    quote.paymentPaidAt = new Date();
    const saved = await this.quoteRepository.save(quote);

    await this.appendSystemEvent(saved.id, 'quote_payment_confirmed', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });

    await this.appendSystemEvent(saved.id, 'quote_accepted', {
      amountTtc: Number(saved.amountTtc),
      currency: saved.currency,
    });

    try {
      await this.mailService.sendQuotePaymentConfirmedEmail({
        to: saved.requesterEmail,
        requesterName: saved.requesterName,
        publicReference: saved.publicReference,
        amountTtc: Number(saved.amountTtc),
        currency: saved.currency,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
          `Quote payment confirmation email failed for quote ${saved.id}: ${reason}`,
      );
    }

    await this.notifyAdmin(
      'Paiement devis confirme',
      `Le devis ${saved.publicReference} a ete regle.`,
      saved,
    );

    if (saved.userId) {
      try {
        await this.notificationsService.createForUser({
          type: 'devis',
          title: 'Paiement confirme',
          message: `Votre paiement pour le devis ${saved.publicReference} a ete confirme. Une reservation a ete creee automatiquement.`,
          recipientUserId: saved.userId,
          metadata: {
            quoteId: saved.id,
            publicReference: saved.publicReference,
            status: saved.status,
          },
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown reason';
        this.logger.warn(
          `Quote payment confirmed user notification failed for quote ${saved.id}: ${reason}`,
        );
      }
    }

    try {
      await this.convertToReservation(saved.id, {
        amountTtc: Number(saved.amountTtc),
        depositAmount: 0,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Auto-conversion to reservation failed for quote ${saved.id}: ${reason}`,
      );
    }

    return saved;
  }

  async convertToReservation(
    quoteId: string,
    dto: ConvertQuoteToReservationDto,
  ): Promise<{ quote: Quote; reservationId: string; reservationPublicReference: string }> {
    const quote = await this.findOne(quoteId);

    if (quote.status !== QuoteStatus.PAYEE) {
      throw new BadRequestException(
        `Only PAYEE quote can be converted, current status is ${quote.status}`,
      );
    }

    const reservationPayload: CreateReservationDto = {
      vehicleId: dto.vehicleId,
      requesterType: quote.requesterType,
      requesterName: quote.requesterName,
      requesterEmail: quote.requesterEmail,
      requesterPhone: quote.requesterPhone,
      companyName: quote.companyName ?? undefined,
      companySiret: quote.companySiret ?? undefined,
      startAt: quote.startAt,
      endAt: quote.endAt,
      pickupCity: quote.pickupCity,
      requestedVehicleType: quote.requestedVehicleType,
      amountTtc: dto.amountTtc ?? Number(quote.amountTtc),
      depositAmount: dto.depositAmount ?? 0,
    };

    const reservation = await this.reservationsService.create(reservationPayload);

    try {
      await this.reservationsService.confirmFromQuoteConversion(reservation.id);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Could not auto-confirm reservation ${reservation.id} from quote ${quoteId}: ${reason}`,
      );
    }

    this.ensureTransition(quote.status, QuoteStatus.CONVERTI_RESERVATION);
    quote.status = QuoteStatus.CONVERTI_RESERVATION;
    const saved = await this.quoteRepository.save(quote);

    await this.appendSystemEvent(saved.id, 'quote_converted_to_reservation', {
      reservationId: reservation.id,
      reservationPublicReference: reservation.publicReference,
    });

    await this.notifyAdmin(
      'Devis converti en reservation',
      `Le devis ${saved.publicReference} a ete converti en reservation ${reservation.publicReference}.`,
      saved,
    );

    return {
      quote: saved,
      reservationId: reservation.id,
      reservationPublicReference: reservation.publicReference,
    };
  }

  async findEvents(
    quoteId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<QuoteEvent>> {
    await this.findOne(quoteId);

    const pagination = resolvePagination(page, limit);
    const [items, totalItems] = await this.quoteEventRepository.findAndCount({
      where: { quoteId },
      order: { occurredAt: 'ASC', createdAt: 'ASC' },
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

  async findEventsForCustomer(
    quoteId: string,
    userId: string,
    requesterEmail: string | undefined,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<QuoteEvent>> {
    const quote = await this.findOneForCustomer(quoteId, userId, requesterEmail);
    return this.findEvents(quote.id, page, limit);
  }

  async respondToProposalAsCustomer(
    quoteId: string,
    userId: string,
    requesterEmail: string | undefined,
    dto: CustomerQuoteResponseDto,
  ): Promise<{ quote: Quote; paymentLinkUrl?: string }> {
    const quote = await this.findOneForCustomer(quoteId, userId, requesterEmail);
    const comment = dto.comment?.trim() ?? '';

    if (
      dto.action !== CustomerQuoteResponseAction.ACCEPTER &&
      !comment
    ) {
      throw new BadRequestException(
        'Comment is required for REFUSER and CONTRE_PROPOSITION actions',
      );
    }

    let paymentLinkUrl: string | undefined;

    if (dto.action === CustomerQuoteResponseAction.ACCEPTER) {
      if (
        quote.status !== QuoteStatus.PROPOSITION_ENVOYEE &&
        quote.status !== QuoteStatus.EN_NEGOCIATION &&
        quote.status !== QuoteStatus.EN_ATTENTE_PAIEMENT
      ) {
        throw new BadRequestException(
          `Cannot accept quote in ${quote.status} status`,
        );
      }

      if (quote.status !== QuoteStatus.EN_ATTENTE_PAIEMENT) {
        this.ensureTransition(quote.status, QuoteStatus.EN_ATTENTE_PAIEMENT);
        quote.status = QuoteStatus.EN_ATTENTE_PAIEMENT;
      }

      const savedQuote = await this.quoteRepository.save(quote);

      await this.appendSystemEvent(savedQuote.id, 'quote_customer_accepted', {
        comment: comment || null,
      });

      paymentLinkUrl = (
        await this.createPaymentSession(savedQuote.id)
      ).checkoutUrl;

      try {
        await this.mailService.sendQuotePaymentReadyEmail({
          to: savedQuote.requesterEmail,
          requesterName: savedQuote.requesterName,
          publicReference: savedQuote.publicReference,
          amountTtc: Number(savedQuote.amountTtc),
          currency: savedQuote.currency,
          paymentUrl: paymentLinkUrl,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown reason';
        this.logger.warn(
          `Quote payment-ready email failed for quote ${savedQuote.id}: ${reason}`,
        );
      }

      if (savedQuote.userId) {
        try {
          await this.notificationsService.createForUser({
            type: 'devis',
            title: 'Lien de paiement disponible',
            message: `Votre devis ${savedQuote.publicReference} est pret au paiement.`,
            recipientUserId: savedQuote.userId,
            metadata: {
              quoteId: savedQuote.id,
              publicReference: savedQuote.publicReference,
              status: savedQuote.status,
            },
          });
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'unknown reason';
          this.logger.warn(
            `Quote payment-ready user notification failed for quote ${savedQuote.id}: ${reason}`,
          );
        }
      }

      await this.notifyAdmin(
        'Devis accepte par le client',
        `Le client a accepte le devis ${savedQuote.publicReference}.`,
        savedQuote,
      );

      return { quote: savedQuote, paymentLinkUrl };
    }

    if (dto.action === CustomerQuoteResponseAction.REFUSER) {
      if (
        quote.status !== QuoteStatus.PROPOSITION_ENVOYEE &&
        quote.status !== QuoteStatus.EN_NEGOCIATION &&
        quote.status !== QuoteStatus.EN_ATTENTE_PAIEMENT
      ) {
        throw new BadRequestException(
          `Cannot refuse quote in ${quote.status} status`,
        );
      }

      this.ensureTransition(quote.status, QuoteStatus.REFUSEE);
      quote.status = QuoteStatus.REFUSEE;
      const savedQuote = await this.quoteRepository.save(quote);

      await this.appendSystemEvent(savedQuote.id, 'quote_customer_rejected', {
        comment,
      });

      await this.notifyAdmin(
        'Devis refuse par le client',
        `Le client a refuse le devis ${savedQuote.publicReference}.`,
        savedQuote,
      );

      return { quote: savedQuote };
    }

    if (
      quote.status !== QuoteStatus.PROPOSITION_ENVOYEE &&
      quote.status !== QuoteStatus.EN_ATTENTE_PAIEMENT
    ) {
      throw new BadRequestException(
        `Cannot counter proposal for quote in ${quote.status} status`,
      );
    }

    this.ensureTransition(quote.status, QuoteStatus.EN_NEGOCIATION);
    quote.status = QuoteStatus.EN_NEGOCIATION;
    const savedQuote = await this.quoteRepository.save(quote);

    await this.appendSystemEvent(savedQuote.id, 'quote_customer_counter_proposal', {
      comment,
    });

    try {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        await this.mailService.sendQuoteCounterProposalEmail({
          to: adminEmail,
          requesterName: savedQuote.requesterName,
          publicReference: savedQuote.publicReference,
          comment,
        });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Quote counter-proposal admin email failed for quote ${savedQuote.id}: ${reason}`,
      );
    }

    await this.notifyAdmin(
      'Contre-proposition client',
      `Le client a envoye une contre-proposition sur ${savedQuote.publicReference}.`,
      savedQuote,
    );

    return { quote: savedQuote };
  }

  async remove(id: string): Promise<{ message: string }> {
    const quote = await this.findOne(id);
    quote.archivedAt = new Date();
    await this.quoteRepository.save(quote);
    return { message: 'Quote archived successfully' };
  }

  private async createQuoteCheckoutSession(
    quote: Quote,
    amount: number,
    currencyInput?: string,
  ) {
    const frontendBaseUrl = this.configService.get<string>(
      'FRONTEND_BASE_URL',
      'http://localhost:8080',
    );

    const currency = (currencyInput ?? 'EUR').toUpperCase();

    return this.paymentsService.createCheckoutSession({
      title: `WestDrive - Devis ${quote.publicReference}`,
      description: `Paiement du devis ${quote.publicReference}`,
      amount,
      currency,
      customerEmail: quote.requesterEmail,
      successUrl: `${frontendBaseUrl.replace(/\/$/, '')}/checkout?flow=quote&quoteId=${encodeURIComponent(quote.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendBaseUrl.replace(/\/$/, '')}/checkout?flow=quote&quoteId=${encodeURIComponent(quote.id)}&payment=cancelled`,
      metadata: {
        targetType: 'quote',
        quoteId: quote.id,
        publicReference: quote.publicReference,
      },
    });
  }

  private async createQuotePaymentLink(
    quote: Quote,
    amount: number,
    currencyInput?: string,
  ): Promise<string> {
    const frontendBaseUrl = this.configService.get<string>(
      'FRONTEND_BASE_URL',
      'http://localhost:8080',
    );

    const currency = (currencyInput ?? 'EUR').toUpperCase();

    return this.paymentsService.createPaymentLink({
      title: `WestDrive - Devis ${quote.publicReference}`,
      description: `Paiement du devis ${quote.publicReference}`,
      amount,
      currency,
      customerEmail: quote.requesterEmail,
      successUrl: `${frontendBaseUrl.replace(/\/$/, '')}/checkout?flow=quote&quoteId=${encodeURIComponent(quote.id)}&payment=success`,
      cancelUrl: `${frontendBaseUrl.replace(/\/$/, '')}/checkout?flow=quote&quoteId=${encodeURIComponent(quote.id)}&payment=cancelled`,
      metadata: {
        targetType: 'quote',
        quoteId: quote.id,
        publicReference: quote.publicReference,
      },
    });
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
    return `DEV-${date}-${random}`;
  }

  private ensureTransition(from: QuoteStatus, to: QuoteStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid quote status transition from ${from} to ${to}`,
      );
    }
  }

  private async appendSystemEvent(
    quoteId: string,
    type: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.quoteEventRepository.save(
      this.quoteEventRepository.create({
        quoteId,
        type,
        occurredAt: new Date(),
        payload,
      }),
    );
  }

  private async notifyAdmin(
    title: string,
    message: string,
    quote: Quote,
  ): Promise<void> {
    try {
      await this.notificationsService.createForAdmin({
        type: 'devis',
        title,
        message,
        metadata: {
          quoteId: quote.id,
          publicReference: quote.publicReference,
          status: quote.status,
        },
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Quote admin notification failed for quote ${quote.id}: ${reason}`,
      );
    }
  }

  private async findOneForCustomer(
    quoteId: string,
    userId: string,
    requesterEmail?: string,
  ): Promise<Quote> {
    const normalizedUserId =
      typeof userId === 'string' && userId.trim().length > 0
        ? userId.trim()
        : null;
    const resolvedEmail = await this.resolveRequesterEmail(
      normalizedUserId,
      requesterEmail,
    );

    if (!resolvedEmail && !normalizedUserId) {
      this.logger.warn(
        `findOneForCustomer called without identity for quote ${quoteId}`,
      );
      throw new NotFoundException('Quote not found');
    }

    let quote: Quote | null = null;
    try {
      const query = this.quoteRepository
        .createQueryBuilder('q')
        .where('q.id = :quoteId', { quoteId })
        .andWhere('q.archivedAt IS NULL');

      if (normalizedUserId && resolvedEmail) {
        query.andWhere(
          '(q.userId = :userId OR LOWER(q.requesterEmail) = :email)',
          {
            userId: normalizedUserId,
            email: resolvedEmail,
          },
        );
      } else if (normalizedUserId) {
        query.andWhere('q.userId = :userId', {
          userId: normalizedUserId,
        });
      } else {
        query.andWhere('LOWER(q.requesterEmail) = :email', {
          email: resolvedEmail,
        });
      }

      quote = await query.getOne();
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.error(
        `findOneForCustomer failed (quoteId=${quoteId}, userId=${normalizedUserId ?? 'null'}, email=${resolvedEmail ?? 'null'}): ${reason}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Impossible de charger ce devis pour le moment.',
      );
    }

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  private async resolveRequesterEmail(
    userId: string | null,
    requesterEmail?: string,
  ): Promise<string | null> {
    const normalizedFromToken =
      typeof requesterEmail === 'string' && requesterEmail.trim().length > 0
        ? requesterEmail.trim().toLowerCase()
        : null;

    if (normalizedFromToken) {
      return normalizedFromToken;
    }

    if (!userId) {
      return null;
    }

    const user = await this.usersService.findById(userId);
    if (!user?.email) {
      return null;
    }

    return user.email.trim().toLowerCase();
  }
}
