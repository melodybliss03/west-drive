import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MailService } from '../shared/mail/mail.service';
import { PaymentsService } from '../shared/payments/payments.service';
import {
  buildPaginatedResponse,
  resolvePagination,
  type PaginatedResponse,
} from '../shared/pagination/pagination.util';
import { ConfirmQuotePaymentDto } from './dto/confirm-quote-payment.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { SendQuoteProposalDto } from './dto/send-quote-proposal.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { Quote, QuoteStatus } from './entities/quote.entity';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
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

    try {
      await this.mailService.sendQuoteRequestAcknowledgement({
        to: savedQuote.requesterEmail,
        requesterName: savedQuote.requesterName,
        publicReference: savedQuote.publicReference,
      });

      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        await this.mailService.sendQuoteAdminNotification({
          to: adminEmail,
          requesterName: savedQuote.requesterName,
          requesterEmail: savedQuote.requesterEmail,
          publicReference: savedQuote.publicReference,
        });
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

  async findOne(id: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id, archivedAt: IsNull() },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async updateStatus(id: string, dto: UpdateQuoteStatusDto): Promise<Quote> {
    const quote = await this.findOne(id);

    if (quote.status === QuoteStatus.PAYEE) {
      throw new BadRequestException('Paid quote cannot be changed');
    }

    quote.status = dto.status;
    await this.quoteRepository.save(quote);

    if (dto.status === QuoteStatus.REFUSEE) {
      try {
        await this.mailService.sendQuoteRejectedEmail({
          to: quote.requesterEmail,
          requesterName: quote.requesterName,
          publicReference: quote.publicReference,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown reason';
        this.logger.warn(
          `Quote rejection email failed for quote ${quote.id}: ${reason}`,
        );
      }
    }

    return quote;
  }

  async sendProposal(
    id: string,
    dto: SendQuoteProposalDto,
  ): Promise<{ quote: Quote; checkoutUrl: string; sessionId: string }> {
    const quote = await this.findOne(id);

    if (
      quote.status === QuoteStatus.PAYEE ||
      quote.status === QuoteStatus.REFUSEE ||
      quote.status === QuoteStatus.ANNULEE
    ) {
      throw new BadRequestException(
        `Cannot send proposal for quote in ${quote.status} status`,
      );
    }

    const session = await this.createQuoteCheckoutSession(quote, dto.amountTtc, dto.currency);

    quote.amountTtc = dto.amountTtc.toFixed(2);
    quote.currency = (dto.currency ?? 'EUR').toUpperCase();
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
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Quote proposal email failed for quote ${savedQuote.id}: ${reason}`,
      );
    }

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

    const session = await this.paymentsService.retrieveCheckoutSession(dto.sessionId);
    const metadata = session.metadata ?? {};

    if (metadata.targetType !== 'quote' || metadata.quoteId !== quote.id) {
      throw new BadRequestException('Checkout session does not match quote');
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Stripe session is not marked as paid');
    }

    quote.status = QuoteStatus.PAYEE;
    quote.paymentSessionId = session.id;
    quote.paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    quote.paymentPaidAt = new Date();
    await this.quoteRepository.save(quote);

    try {
      await this.mailService.sendQuotePaymentConfirmedEmail({
        to: quote.requesterEmail,
        requesterName: quote.requesterName,
        publicReference: quote.publicReference,
        amountTtc: Number(quote.amountTtc),
        currency: quote.currency,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown reason';
      this.logger.warn(
        `Quote payment confirmation email failed for quote ${quote.id}: ${reason}`,
      );
    }

    return quote;
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
}
