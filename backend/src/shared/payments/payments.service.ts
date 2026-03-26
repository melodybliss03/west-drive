import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type CheckoutSessionInput = {
  title: string;
  description?: string;
  amount: number;
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

@Injectable()
export class PaymentsService {
  private readonly stripeSecretKey: string;
  private readonly stripeWebhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    this.stripeWebhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
      '',
    );
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<Stripe.Checkout.Session> {
    const stripe = this.getStripeClient();
    const amountInCents = this.toAmountInCents(input.amount);

    return stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: input.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: amountInCents,
            product_data: {
              name: input.title,
              description: input.description,
            },
          },
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: input.metadata,
    });
  }

  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    const stripe = this.getStripeClient();
    return stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
  }

  async createPaymentLink(input: {
    title: string;
    description?: string;
    amount: number;
    currency: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    const stripe = this.getStripeClient();
    const amountInCents = this.toAmountInCents(input.amount);

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: amountInCents,
            product_data: {
              name: input.title,
              description: input.description,
            },
          },
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: input.successUrl,
        },
      },
      metadata: input.metadata,
    } as any);

    return paymentLink.url || '';
  }

  parseWebhookEvent(
    payload: Buffer | string | Record<string, unknown>,
    signature?: string,
  ): Stripe.Event {
    const stripe = this.getStripeClient();

    if (this.stripeWebhookSecret) {
      if (!signature) {
        throw new BadRequestException('Missing Stripe signature header');
      }

      return stripe.webhooks.constructEvent(
        this.toPayloadBuffer(payload),
        signature,
        this.stripeWebhookSecret,
      );
    }

    if (typeof payload === 'string') {
      return JSON.parse(payload) as Stripe.Event;
    }

    if (Buffer.isBuffer(payload)) {
      return JSON.parse(payload.toString('utf-8')) as Stripe.Event;
    }

    return payload as unknown as Stripe.Event;
  }

  private getStripeClient(): Stripe {
    if (!this.stripeSecretKey) {
      throw new ServiceUnavailableException(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY.',
      );
    }

    return new Stripe(this.stripeSecretKey);
  }

  private toAmountInCents(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ServiceUnavailableException('Payment amount must be greater than zero.');
    }

    return Math.round(amount * 100);
  }

  private toPayloadBuffer(payload: Buffer | string | Record<string, unknown>): Buffer {
    if (Buffer.isBuffer(payload)) {
      return payload;
    }

    if (typeof payload === 'string') {
      return Buffer.from(payload, 'utf-8');
    }

    return Buffer.from(JSON.stringify(payload), 'utf-8');
  }
}
