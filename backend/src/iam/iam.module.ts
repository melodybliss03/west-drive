import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../shared/mail/mail.module';
import { User } from '../users/entities/user.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { PermissionsGuard } from './guards/permissions.guard';
import { IamController } from './iam.controller';
import { IamService } from './iam.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MailModule,
    TypeOrmModule.forFeature([
      User,
      Permission,
      Role,
      RolePermission,
      UserRole,
    ]),
  ],
  providers: [IamService, PermissionsGuard],
  controllers: [IamController],
  exports: [IamService],
})
export class IamModule {}
