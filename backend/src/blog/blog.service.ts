import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  resolvePagination,
  type PaginatedResponse,
} from '../shared/pagination/pagination.util';
import { CloudinaryService } from '../shared/storage/cloudinary.service';
import { CreateBlogArticleDto } from './dto/create-blog-article.dto';
import { UpdateBlogArticleDto } from './dto/update-blog-article.dto';
import { BlogArticle, BlogArticleStatus } from './entities/blog-article.entity';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogArticle)
    private readonly blogRepository: Repository<BlogArticle>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  async listPublished(
    page = 1,
    limit = 20,
    category?: string,
    search?: string,
  ): Promise<PaginatedResponse<BlogArticle>> {
    const pagination = resolvePagination(page, limit);

    const qb = this.blogRepository
      .createQueryBuilder('article')
      .where('article.status = :status', { status: BlogArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    if (category) {
      qb.andWhere('LOWER(article.category) = LOWER(:category)', { category });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(article.title) LIKE :search OR LOWER(article.excerpt) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    const [items, totalItems] = await qb.getManyAndCount();
    return buildPaginatedResponse(items, pagination.page, pagination.limit, totalItems);
  }

  async findBySlug(slug: string): Promise<BlogArticle> {
    const article = await this.blogRepository.findOne({
      where: { slug, status: BlogArticleStatus.PUBLISHED },
    });
    if (!article) throw new NotFoundException(`Article not found`);
    return article;
  }

  async adminFindById(id: string): Promise<BlogArticle> {
    const article = await this.blogRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    return article;
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async adminList(
    page = 1,
    limit = 20,
    filters: { status?: BlogArticleStatus; category?: string; search?: string } = {},
  ): Promise<PaginatedResponse<BlogArticle>> {
    const pagination = resolvePagination(page, limit);

    const qb = this.blogRepository
      .createQueryBuilder('article')
      .orderBy('article.createdAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    if (filters.status) {
      qb.andWhere('article.status = :status', { status: filters.status });
    }
    if (filters.category) {
      qb.andWhere('LOWER(article.category) = LOWER(:category)', { category: filters.category });
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(article.title) LIKE :search OR LOWER(article.excerpt) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    const [items, totalItems] = await qb.getManyAndCount();
    return buildPaginatedResponse(items, pagination.page, pagination.limit, totalItems);
  }

  async adminCreate(dto: CreateBlogArticleDto): Promise<BlogArticle> {
    const slug = dto.slug?.trim() || this.generateSlug(dto.title);
    await this.ensureSlugUnique(slug);

    const article = this.blogRepository.create({
      title: dto.title.trim(),
      slug,
      excerpt: dto.excerpt?.trim() || null,
      content: dto.content,
      category: dto.category?.trim() || null,
      mainImageUrl: dto.mainImageUrl?.trim() || null,
      status: dto.status ?? BlogArticleStatus.DRAFT,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
    });

    if (
      article.status === BlogArticleStatus.PUBLISHED &&
      !article.publishedAt
    ) {
      article.publishedAt = new Date();
    }

    return this.blogRepository.save(article);
  }

  async adminUpdate(id: string, dto: UpdateBlogArticleDto): Promise<BlogArticle> {
    const article = await this.blogRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    if (dto.title !== undefined) article.title = dto.title.trim();
    if (dto.slug !== undefined) {
      const newSlug = dto.slug.trim();
      if (newSlug !== article.slug) {
        await this.ensureSlugUnique(newSlug);
        article.slug = newSlug;
      }
    }
    if (dto.excerpt !== undefined) article.excerpt = dto.excerpt?.trim() || null;
    if (dto.content !== undefined) article.content = dto.content;
    if (dto.category !== undefined) article.category = dto.category?.trim() || null;
    if (dto.mainImageUrl !== undefined) article.mainImageUrl = dto.mainImageUrl?.trim() || null;
    if (dto.publishedAt !== undefined) {
      article.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    }
    if (dto.status !== undefined) {
      article.status = dto.status;
      if (
        dto.status === BlogArticleStatus.PUBLISHED &&
        !article.publishedAt
      ) {
        article.publishedAt = new Date();
      }
    }

    return this.blogRepository.save(article);
  }

  async adminDelete(id: string): Promise<void> {
    const article = await this.blogRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    await this.blogRepository.remove(article);
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const asset = await this.cloudinaryService.uploadImage({
      folder: 'blog',
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });
    return { url: asset.secureUrl };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async ensureSlugUnique(slug: string): Promise<void> {
    const existing = await this.blogRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" is already in use`);
    }
  }
}
