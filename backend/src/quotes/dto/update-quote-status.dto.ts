import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { QuoteStatus } from '../entities/quote.entity';

export class UpdateQuoteStatusDto {
  @ApiProperty({ enum: QuoteStatus })
  @IsEnum(QuoteStatus)
  status!: QuoteStatus;
}
