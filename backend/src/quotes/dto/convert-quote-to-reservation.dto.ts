import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class ConvertQuoteToReservationDto {
  @ApiPropertyOptional({
    description: 'Vehicule a affecter a la reservation creee',
    example: '8c2d4cb8-6220-4fb8-a391-7a2ba81c9688',
  })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({
    description: 'Montant TTC final force pour la reservation creee (sinon montant du devis)',
    example: 1490,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountTtc?: number;

  @ApiPropertyOptional({
    description: 'Depot force pour la reservation creee (sinon 0)',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositAmount?: number;
}
