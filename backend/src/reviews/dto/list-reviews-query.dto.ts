import { IsOptional, IsUUID } from 'class-validator';

export class ListReviewsQueryDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
