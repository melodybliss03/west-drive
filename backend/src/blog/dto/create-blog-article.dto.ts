import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BlogArticleStatus } from '../entities/blog-article.entity';

export class CreateBlogArticleDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  mainImageUrl?: string;

  @IsOptional()
  @IsEnum(BlogArticleStatus)
  status?: BlogArticleStatus;

  @IsOptional()
  @IsISO8601()
  publishedAt?: string;
}
