import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { BlogArticleStatus } from './entities/blog-article.entity';
import { CreateBlogArticleDto } from './dto/create-blog-article.dto';
import { UpdateBlogArticleDto } from './dto/update-blog-article.dto';
import { BlogService } from './blog.service';

const MAX_BLOG_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB

@ApiTags('Admin – Blog')
@ApiBearerAuth()
@Controller('admin/blog')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @RequirePermissions('blog.read')
  @ApiOperation({ summary: 'Lister tous les articles (admin)' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    @Query('status') status?: BlogArticleStatus,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.blogService.adminList(page, limit, { status, category, search });
  }

  @Get(':id')
  @RequirePermissions('blog.read')
  @ApiOperation({ summary: 'Récupérer un article par ID (admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogService.adminFindById(id);
  }

  @Post()
  @RequirePermissions('blog.write')
  @ApiOperation({ summary: 'Créer un article (admin)' })
  create(@Body() dto: CreateBlogArticleDto) {
    return this.blogService.adminCreate(dto);
  }

  @Patch(':id')
  @RequirePermissions('blog.write')
  @ApiOperation({ summary: 'Modifier un article (admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlogArticleDto,
  ) {
    return this.blogService.adminUpdate(id, dto);
  }

  @Post('upload-image')
  @RequirePermissions('blog.write')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_BLOG_IMAGE_SIZE } }),
  )
  @ApiOperation({ summary: 'Uploader une image pour un article de blog' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file is required');
    if (!file.mimetype.startsWith('image/'))
      throw new BadRequestException('Only image files are allowed');
    return this.blogService.uploadImage(file);
  }

  @Delete(':id')
  @RequirePermissions('blog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un article (admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogService.adminDelete(id);
  }
}
