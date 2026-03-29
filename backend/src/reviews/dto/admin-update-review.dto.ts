import { PartialType } from '@nestjs/mapped-types';
import { AdminCreateReviewDto } from './admin-create-review.dto';

export class AdminUpdateReviewDto extends PartialType(AdminCreateReviewDto) {}
