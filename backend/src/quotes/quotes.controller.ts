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
import { ConfirmQuotePaymentDto } from './dto/confirm-quote-payment.dto';
import { ConvertQuoteToReservationDto } from './dto/convert-quote-to-reservation.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CustomerQuoteResponseDto } from './dto/customer-quote-response.dto';
import { SendQuoteProposalDto } from './dto/send-quote-proposal.dto';
import { StartQuoteAnalysisDto } from './dto/start-quote-analysis.dto';
import { StartQuoteNegotiationDto } from './dto/start-quote-negotiation.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuotesService } from './quotes.service';

@ApiTags('Quotes')
@ApiBearerAuth()
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard, CustomerIfAuthenticatedGuard)
  @ApiOperation({ summary: 'Creer une demande de devis' })
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('quotes.read')
  @ApiOperation({ summary: 'Lister les devis' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Permission quotes.read requise.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.quotesService.findAll(page, limit);
  }

  @Get('me/list')
  @UseGuards(JwtAuthGuard, CustomerOnlyGuard)
  @ApiOperation({ summary: 'Lister mes devis (espace client)' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.quotesService.findMineForUser(user.sub, user.email, page, limit);
  }

  @Get('me/:id/events')
  @UseGuards(JwtAuthGuard, CustomerOnlyGuard)
  @ApiOperation({ summary: 'Lister la timeline d un devis du client courant' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  findMineEvents(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.quotesService.findEventsForCustomer(
      id,
      user.sub,
      user.email,
      page,
      limit,
    );
  }

  @Post('me/:id/respond')
  @UseGuards(JwtAuthGuard, CustomerOnlyGuard)
  @ApiOperation({ summary: 'Repondre a une proposition de devis' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  respondToProposal(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CustomerQuoteResponseDto,
  ) {
    return this.quotesService.respondToProposalAsCustomer(
      id,
      user.sub,
      user.email,
      dto,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('quotes.read')
  @ApiOperation({ summary: 'Recuperer un devis' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Permission quotes.read requise.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quotesService.findOne(id);
  }

  @Post(':id/proposal')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('quotes.manage')
  @ApiOperation({ summary: 'Envoyer une proposition commerciale avec lien de paiement Stripe' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Permission quotes.manage requise.' })
  sendProposal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendQuoteProposalDto,
  ) {
    return this.quotesService.sendProposal(id, dto);
  }

  @Post(':id/analysis')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('quotes.manage')
  @ApiOperation({ summary: 'Passer un devis en analyse' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Permission quotes.manage requise.' })
  startAnalysis(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: StartQuoteAnalysisDto,
  ) {
    return this.quotesService.startAnalysis(id, dto);
  }

  @Post(':id/negotiation')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('quotes.manage')
  @ApiOperation({ summary: 'Passer un devis en negociation' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Permission quotes.manage requise.' })
  startNegotiation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: StartQuoteNegotiationDto,
  ) {
    return this.quotesService.startNegotiation(id, dto);
  }

  @Post(':id/payment-session')
  @ApiOperation({ summary: 'Regenerer un lien de paiement Stripe pour un devis' })
  createPaymentSession(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quotesService.createPaymentSession(id);
  }

  @Post(':id/payment-link')
  @ApiOperation({ summary: 'Creer un lien de paiement Stripe pour un devis' })
  createPaymentLink(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quotesService.createPaymentLink(id);
  }

  @Post(':id/payment-confirmation')
  @ApiOperation({ summary: 'Confirmer le paiement Stripe d un devis' })
  confirmPayment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ConfirmQuotePaymentDto,
  ) {
    return this.quotesService.confirmPayment(id, dto);
  }

  @Post(':id/convert-to-reservation')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('quotes.manage')
  @ApiOperation({ summary: 'Convertir un devis paye en reservation' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Permission quotes.manage requise.' })
  convertToReservation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ConvertQuoteToReservationDto,
  ) {
    return this.quotesService.convertToReservation(id, dto);
  }

  @Get(':id/events')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('quotes.read')
  @ApiOperation({ summary: 'Lister la timeline d un devis' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Permission quotes.read requise.' })
  findEvents(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.quotesService.findEvents(id, page, limit);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('quotes.manage')
  @ApiOperation({ summary: 'Mettre a jour le statut d un devis' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Permission quotes.manage requise.' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateQuoteStatusDto,
  ) {
    return this.quotesService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('quotes.manage')
  @ApiOperation({ summary: 'Archiver un devis' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Permission quotes.manage requise.' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quotesService.remove(id);
  }
}
