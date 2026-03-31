import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CompanyProfile } from './entities/company-profile.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, CompanyProfile, Reservation])],
  controllers: [UsersController],
  providers: [UsersService, PermissionsGuard],
  exports: [UsersService],
})
export class UsersModule {}
