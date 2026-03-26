import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class SendQuoteProposalDto {
  @ApiProperty({ example: 990 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  amountTtc!: number;

  @ApiPropertyOptional({ example: 'EUR', default: 'EUR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Détails structurés de la proposition envoyée au client',
    example: {
      vehicles: [
        {
          typeVehicule: 'SUV',
          dateDebut: '2026-04-20',
          dateFin: '2026-04-25',
          prixJour: 198,
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  proposalDetails?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Message commercial personnalisé envoyé avec le lien de paiement',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
