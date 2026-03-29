import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { QuotesService } from '../quotes/quotes.service';
import { ReservationsService } from '../reservations/reservations.service';
import { PaymentsService } from '../shared/payments/payments.service';

@Controller('payments/stripe')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly reservationsService: ReservationsService,
    private readonly quotesService: QuotesService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Body() body: Record<string, unknown>,
    @Headers('stripe-signature') signature?: string,
  ): Promise<{ received: true }> {
    const sigPreview = signature ? `${signature.slice(0, 12)}...` : 'missing';
    const rawLength = req.rawBody
      ? Buffer.isBuffer(req.rawBody)
        ? req.rawBody.length
        : JSON.stringify(req.rawBody).length
      : typeof body === 'object'
      ? JSON.stringify(body).length
      : 0;

    this.logger.log(
      `Stripe webhook received (signature=${sigPreview}, rawLength=${rawLength})`,
    );

    let event: Stripe.Event;
    try {
      event = this.paymentsService.parseWebhookEvent(req.rawBody ?? body, signature);
      this.logger.log(`Stripe event parsed: type=${event.type ?? 'unknown'} id=${event.id ?? 'unknown'}`);
    } catch (err) {
      this.logger.error(
        `Failed to parse Stripe webhook: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }

    try {
      if (event.type === 'checkout.session.completed') {
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        this.logger.log(`Processed webhook event checkout.session.completed id=${event.id ?? 'unknown'}`);
      } else {
        this.logger.log(`Ignored Stripe event type=${event.type ?? 'unknown'}`);
      }
    } catch (err) {
      this.logger.error(
        `Error while processing Stripe webhook event: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const metadata = session.metadata ?? {};
    const targetType = metadata.targetType;

    this.logger.log(
      `Handling checkout.session.completed: sessionId=${session.id ?? 'unknown'} targetType=${targetType ?? 'unknown'} metadataKeys=${Object.keys(metadata).join(',')}`,
    );

    if (!session.id) {
      this.logger.warn('Received checkout.session.completed without session id');
      return;
    }

    if (targetType === 'reservation' && metadata.reservationId) {
      this.logger.log(`checkout.session.completed -> reservation: reservationId=${metadata.reservationId} sessionId=${session.id}`);
      try {
        await this.reservationsService.confirmPayment(metadata.reservationId, {
          sessionId: session.id,
        });
        this.logger.log(`Reservation payment confirmed: ${metadata.reservationId}`);
      } catch (err) {
        this.logger.error(
          `Failed to confirm reservation payment ${metadata.reservationId}: ${err instanceof Error ? err.message : String(err)}`,
          err instanceof Error ? err.stack : undefined,
        );
        throw err;
      }
      return;
    }

    if (targetType === 'quote' && metadata.quoteId) {
      this.logger.log(`checkout.session.completed -> quote: quoteId=${metadata.quoteId} sessionId=${session.id}`);
      try {
        await this.quotesService.confirmPayment(metadata.quoteId, {
          sessionId: session.id,
        });
        this.logger.log(`Quote payment confirmed: ${metadata.quoteId}`);
      } catch (err) {
        this.logger.error(
          `Failed to confirm quote payment ${metadata.quoteId}: ${err instanceof Error ? err.message : String(err)}`,
          err instanceof Error ? err.stack : undefined,
        );
        throw err;
      }
      return;
    }

    this.logger.warn(
      `Unhandled Stripe checkout session target: ${targetType ?? 'unknown'}`,
    );
  }
}
