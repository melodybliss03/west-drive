import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { ReviewStatus } from './entities/review.entity';
import { AdminCreateReviewDto } from './dto/admin-create-review.dto';
import { AdminUpdateReviewDto } from './dto/admin-update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Admin – Reviews')
@ApiBearerAuth()
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @RequirePermissions('avis.read')
  @ApiOperation({ summary: 'Lister tous les avis (admin)' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    @Query('status') status?: ReviewStatus,
    @Query('minRating', new DefaultValuePipe(0), ParseIntPipe) minRating = 0,
    @Query('maxRating', new DefaultValuePipe(5), ParseIntPipe) maxRating = 5,
    @Query('source') source?: string,
  ) {
    return this.reviewsService.adminList(page, limit, {
      status,
      minRating: minRating > 0 ? minRating : undefined,
      maxRating: maxRating < 5 ? maxRating : undefined,
      source,
    });
  }

  @Post()
  @RequirePermissions('avis.write')
  @ApiOperation({ summary: 'Créer un avis manuellement (admin)' })
  create(@Body() dto: AdminCreateReviewDto) {
    return this.reviewsService.adminCreate(dto);
  }

  @Post('bulk')
  @RequirePermissions('avis.write')
  @ApiOperation({ summary: 'Import en masse (admin)' })
  bulkCreate(@Body() dtos: AdminCreateReviewDto[]) {
    return this.reviewsService.adminBulkCreate(dtos);
  }

  @Patch(':id')
  @RequirePermissions('avis.write')
  @ApiOperation({ summary: 'Mettre à jour un avis (admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateReviewDto,
  ) {
    return this.reviewsService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('avis.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un avis (admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.adminDelete(id);
  }
}
