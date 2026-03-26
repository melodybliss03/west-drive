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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { ConfirmQuotePaymentDto } from './dto/confirm-quote-payment.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { SendQuoteProposalDto } from './dto/send-quote-proposal.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuotesService } from './quotes.service';

@ApiTags('Quotes')
@ApiBearerAuth()
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
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
