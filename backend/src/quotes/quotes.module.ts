import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { MailModule } from '../shared/mail/mail.module';
import { PaymentsModule } from '../shared/payments/payments.module';
import { UsersModule } from '../users/users.module';
import { QuoteEvent } from './entities/quote-event.entity';
import { Quote } from './entities/quote.entity';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, QuoteEvent]),
    AuthModule,
    UsersModule,
    MailModule,
    PaymentsModule,
    NotificationsModule,
    ReservationsModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
