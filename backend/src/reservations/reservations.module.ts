import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { VehicleScheduleSlot } from '../fleet/entities/vehicle-schedule-slot.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../shared/mail/mail.module';
import { UsersModule } from '../users/users.module';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { ReservationEvent } from './entities/reservation-event.entity';
import { Reservation } from './entities/reservation.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MailModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      Reservation,
      ReservationEvent,
      Vehicle,
      VehicleScheduleSlot,
    ]),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
