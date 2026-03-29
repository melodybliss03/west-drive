import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsOptional, Min, ValidateNested } from 'class-validator';

class FleetMaintenanceRequiredDto {
  @ApiPropertyOptional({
    example: 150000,
    description:
      'Seuil kilométrique absolu à partir duquel un entretien est requis.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;
}

export class UpdateFleetVehicleMileageDto {
  @ApiProperty({
    example: 52340,
    description: 'Kilometrage total du vehicule en km',
  })
  @IsInt()
  @Min(0)
  mileage!: number;

  @ApiPropertyOptional({
    type: FleetMaintenanceRequiredDto,
    nullable: true,
    description:
      'Règle de seuil km absolu. null pour vider la règle.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FleetMaintenanceRequiredDto)
  maintenanceRequired?: FleetMaintenanceRequiredDto | null;

  @ApiPropertyOptional({
    example: '2024-06-15T00:00:00.000Z',
    description: 'Date du dernier entretien (saisie manuelle, ISO 8601).',
  })
  @IsOptional()
  @IsISO8601()
  lastMaintenanceAt?: string;

  @ApiPropertyOptional({
    example: '2025-06-15T00:00:00.000Z',
    description: 'Date du prochain entretien prévu (saisie manuelle, ISO 8601).',
  })
  @IsOptional()
  @IsISO8601()
  nextMaintenanceAt?: string;
}

