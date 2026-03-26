import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { QuoteStatus } from '../entities/quote.entity';

export class UpdateQuoteStatusDto {
  @ApiProperty({ enum: QuoteStatus })
  @IsEnum(QuoteStatus)
  status!: QuoteStatus;

  @ApiProperty({
    required: false,
    description: 'Commentaire optionnel envoye au client avec le changement de statut',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
