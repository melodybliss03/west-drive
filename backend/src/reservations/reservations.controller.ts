import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CustomerIfAuthenticatedGuard,
  CustomerOnlyGuard,
} from '../auth/guards/customer-only.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { CreateReservationEventDto } from './dto/create-reservation-event.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateStripePreauthDto } from './dto/create-stripe-preauth.dto';
import { ConfirmReservationPaymentDto } from './dto/confirm-reservation-payment.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard, CustomerIfAuthenticatedGuard)
  @ApiOperation({ summary: 'Creer une reservation' })
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('reservations.read')
  @ApiOperation({ summary: 'Lister les reservations' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({
    description: 'Permission reservations.read requise.',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    @Query('userId') userId?: string,
  ) {
    return this.reservationsService.findAll(page, limit, userId);
  }

  @Get('me/list')
  @UseGuards(JwtAuthGuard, CustomerOnlyGuard)
  @ApiOperation({ summary: 'Lister mes reservations (espace client)' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.reservationsService.findMine(user.sub, user.email, page, limit);
  }

  @Get('me/:id/events')
  @UseGuards(JwtAuthGuard, CustomerOnlyGuard)
  @ApiOperation({ summary: 'Lister ma timeline reservation' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  findMineEvents(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.reservationsService.findEventsForCustomer(
      id,
      user.sub,
      user.email,
      page,
      limit,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('reservations.read')
  @ApiOperation({ summary: 'Recuperer une reservation par id' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({
    description: 'Permission reservations.read requise.',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('reservations.manage')
  @ApiOperation({ summary: 'Mettre a jour une reservation' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({
    description: 'Permission reservations.manage requise.',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('reservations.manage')
  @ApiOperation({ summary: 'Changer le statut d une reservation' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({
    description: 'Permission reservations.manage requise.',
  })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto);
  }

  @Post(':id/stripe-preauth')
  @ApiOperation({ summary: 'Creer une preautorisation Stripe de reservation' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  createStripePreauth(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateStripePreauthDto,
  ) {
    return this.reservationsService.createStripePreauth(id, dto);
  }

  @Post(':id/payment-session')
  @ApiOperation({ summary: 'Creer une session Stripe Checkout pour reservation' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  createPaymentSession(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reservationsService.createPaymentSession(id);
  }

  @Post(':id/payment-link')
  @ApiOperation({ summary: 'Creer un lien de paiement Stripe pour reservation' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  createPaymentLink(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reservationsService.createPaymentLink(id);
  }

  @Post(':id/payment-confirmation')
  @ApiOperation({ summary: 'Confirmer le paiement Stripe d une reservation' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  confirmPayment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ConfirmReservationPaymentDto,
  ) {
    return this.reservationsService.confirmPayment(id, dto);
  }

  @Post(':id/events')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('reservations.manage')
  @ApiOperation({ summary: 'Ajouter un evenement timeline a une reservation' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({
    description: 'Permission reservations.manage requise.',
  })
  createEvent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateReservationEventDto,
  ) {
    return this.reservationsService.createEvent(id, dto);
  }

  @Get(':id/events')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('reservations.read')
  @ApiOperation({ summary: 'Lister la timeline d une reservation' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({
    description: 'Permission reservations.read requise.',
  })
  findEvents(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.reservationsService.findEvents(id, page, limit);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('reservations.manage')
  @ApiOperation({ summary: 'Supprimer une reservation' })
  @ApiParam({ name: 'id', description: 'UUID de la reservation' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({
    description: 'Permission reservations.manage requise.',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reservationsService.remove(id);
  }
}
