import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ReviewStatus } from '../entities/review.entity';

export class AdminCreateReviewDto {
  @IsString()
  authorName!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  /** ISO 8601 date string – permet de conserver les dates historiques */
  @IsOptional()
  @IsISO8601()
  createdAt?: string;
}
