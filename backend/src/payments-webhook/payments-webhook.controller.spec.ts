import { Test, TestingModule } from '@nestjs/testing';
import Stripe from 'stripe';
import { QuotesService } from '../quotes/quotes.service';
import { ReservationsService } from '../reservations/reservations.service';
import { PaymentsService } from '../shared/payments/payments.service';
import { PaymentsWebhookController } from './payments-webhook.controller';

describe('PaymentsWebhookController', () => {
  let controller: PaymentsWebhookController;

  const paymentsServiceMock = {
    parseWebhookEvent: jest.fn(),
  };

  const reservationsServiceMock = {
    confirmPayment: jest.fn(),
  };

  const quotesServiceMock = {
    confirmPayment: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsWebhookController],
      providers: [
        { provide: PaymentsService, useValue: paymentsServiceMock },
        { provide: ReservationsService, useValue: reservationsServiceMock },
        { provide: QuotesService, useValue: quotesServiceMock },
      ],
    }).compile();

    controller = module.get<PaymentsWebhookController>(PaymentsWebhookController);
  });

  it('handles reservation checkout.session.completed event', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_res_1',
          metadata: {
            targetType: 'reservation',
            reservationId: 'res-1',
          },
        },
      },
    } as unknown as Stripe.Event;

    paymentsServiceMock.parseWebhookEvent.mockReturnValue(event);

    await expect(
      controller.handleWebhook({ rawBody: Buffer.from('{}') } as any, {}, 'sig'),
    ).resolves.toEqual({ received: true });

    expect(reservationsServiceMock.confirmPayment).toHaveBeenCalledWith('res-1', {
      sessionId: 'cs_test_res_1',
    });
    expect(quotesServiceMock.confirmPayment).not.toHaveBeenCalled();
  });

  it('handles quote checkout.session.completed event', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_quote_1',
          metadata: {
            targetType: 'quote',
            quoteId: 'quote-1',
          },
        },
      },
    } as unknown as Stripe.Event;

    paymentsServiceMock.parseWebhookEvent.mockReturnValue(event);

    await controller.handleWebhook({ rawBody: Buffer.from('{}') } as any, {}, 'sig');

    expect(quotesServiceMock.confirmPayment).toHaveBeenCalledWith('quote-1', {
      sessionId: 'cs_test_quote_1',
    });
    expect(reservationsServiceMock.confirmPayment).not.toHaveBeenCalled();
  });
});
