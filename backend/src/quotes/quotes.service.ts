import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
import { SendQuoteProposalDto } from './dto/send-quote-proposal.dto';
import { StartQuoteAnalysisDto } from './dto/start-quote-analysis.dto';
import { StartQuoteNegotiationDto } from './dto/start-quote-negotiation.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuoteEvent } from './entities/quote-event.entity';
import { Quote, QuoteStatus } from './entities/quote.entity';

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
    private readonly notificationsService: NotificationsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  async create(dto: CreateQuoteDto): Promise<Quote> {
    this.ensureDateRange(dto.startAt, dto.endAt);

    const quote = this.quoteRepository.create({
      publicReference: this.generatePublicReference(),
      requesterType: dto.requesterType,
      requesterName: dto.requesterName,
      requesterEmail: dto.requesterEmail.toLowerCase(),
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
      });

      await this.appendSystemEvent(savedQuote.id, 'quote_ack_email_sent', {});

      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        await this.mailService.sendQuoteAdminNotification({
          to: adminEmail,
          requesterName: savedQuote.requesterName,
          requesterEmail: savedQuote.requesterEmail,
          publicReference: savedQuote.publicReference,
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
  ): Promise<{ quote: Quote; checkoutUrl: string; sessionId: string }> {
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

    const session = await this.createQuoteCheckoutSession(quote, dto.amountTtc, dto.currency);

    quote.amountTtc = dto.amountTtc.toFixed(2);
    quote.currency = (dto.currency ?? 'EUR').toUpperCase();
    this.ensureTransition(quote.status, QuoteStatus.PROPOSITION_ENVOYEE);
    quote.status = QuoteStatus.PROPOSITION_ENVOYEE;
    this.ensureTransition(quote.status, QuoteStatus.EN_ATTENTE_PAIEMENT);
    quote.status = QuoteStatus.EN_ATTENTE_PAIEMENT;
    quote.paymentSessionId = session.id;
    quote.paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    quote.proposalDetails = dto.proposalDetails ?? null;
    quote.proposalMessage = dto.message ?? null;

    const savedQuote = await this.quoteRepository.save(quote);
    const checkoutUrl = session.url;

    if (!checkoutUrl) {
      throw new BadRequestException('Unable to create Stripe checkout URL');
    }

    try {
      await this.mailService.sendQuoteProposalEmail({
        to: savedQuote.requesterEmail,
        requesterName: savedQuote.requesterName,
        publicReference: savedQuote.publicReference,
        amountTtc: dto.amountTtc,
        currency: savedQuote.currency,
        paymentUrl: checkoutUrl,
        message: dto.message,
      });

      await this.appendSystemEvent(savedQuote.id, 'quote_proposal_sent', {
        amountTtc: dto.amountTtc,
        currency: savedQuote.currency,
        message: dto.message ?? null,
      });

      await this.appendSystemEvent(savedQuote.id, 'quote_payment_link_created', {
        checkoutUrl,
        sessionId: session.id,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Quote proposal email failed for quote ${savedQuote.id}: ${reason}`,
      );
    }

    await this.notifyAdmin(
      'Proposition devis envoyee',
      `Une proposition a ete envoyee pour le devis ${savedQuote.publicReference}.`,
      savedQuote,
    );

    return {
      quote: savedQuote,
      checkoutUrl,
      sessionId: session.id,
    };
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
}
