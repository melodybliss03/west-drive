import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
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
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les avis publies' })
  findAllPublished(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    @Query() query?: ListReviewsQueryDto,
  ) {
    return this.reviewsService.listPublished(page, limit, query?.vehicleId);
  }

  @Get('me/pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lister les reservations cloturees sans avis pour le client courant' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  findMyPending(@CurrentUser() user: AuthUser) {
    return this.reviewsService.findMyPendingReservations(user.sub, user.email);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Creer un avis client sur une reservation terminee' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide.' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createByCustomer(user.sub, user.email, dto);
  }
}
