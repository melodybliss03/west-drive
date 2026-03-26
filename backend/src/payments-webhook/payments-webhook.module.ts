import { Module } from '@nestjs/common';
import { QuotesModule } from '../quotes/quotes.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { PaymentsModule } from '../shared/payments/payments.module';
import { PaymentsWebhookController } from './payments-webhook.controller';

@Module({
  imports: [PaymentsModule, ReservationsModule, QuotesModule],
  controllers: [PaymentsWebhookController],
})
export class PaymentsWebhookModule {}
