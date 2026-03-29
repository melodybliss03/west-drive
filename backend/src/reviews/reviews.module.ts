import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { Review } from './entities/review.entity';
import { AdminReviewsController } from './admin-reviews.controller';
import { ReviewsController } from './reviews.controller';
import { ReviewsSeederService } from './reviews-seeder.service';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Reservation, Vehicle, User])],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService, ReviewsSeederService, PermissionsGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}
