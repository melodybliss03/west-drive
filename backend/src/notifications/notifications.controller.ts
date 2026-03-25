import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les notifications de l utilisateur courant' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  list(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.notificationsService.listForUser(user.sub, user.roles ?? [], page, limit);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) notificationId: string,
  ) {
    return this.notificationsService.markAsReadForUser(
      notificationId,
      user.sub,
      user.roles ?? [],
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  async markAllAsRead(@CurrentUser() user: AuthUser) {
    await this.notificationsService.markAllAsReadForUser(
      user.sub,
      user.roles ?? [],
    );
    return { message: 'Notifications marked as read' };
  }
}
