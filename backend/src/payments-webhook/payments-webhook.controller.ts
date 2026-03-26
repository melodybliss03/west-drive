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
    const event = this.paymentsService.parseWebhookEvent(
      req.rawBody ?? body,
      signature,
    );

    if (event.type === 'checkout.session.completed') {
      await this.handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const metadata = session.metadata ?? {};
    const targetType = metadata.targetType;

    if (!session.id) {
      this.logger.warn('Received checkout.session.completed without session id');
      return;
    }

    if (targetType === 'reservation' && metadata.reservationId) {
      await this.reservationsService.confirmPayment(metadata.reservationId, {
        sessionId: session.id,
      });
      return;
    }

    if (targetType === 'quote' && metadata.quoteId) {
      await this.quotesService.confirmPayment(metadata.quoteId, {
        sessionId: session.id,
      });
      return;
    }

    this.logger.warn(
      `Unhandled Stripe checkout session target: ${targetType ?? 'unknown'}`,
    );
  }
}
