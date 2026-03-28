import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, ValidateNested } from 'class-validator';

class FleetMaintenanceRequiredDto {
  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  days?: number;
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
      'Regles d entretien a appliquer sur le vehicule. null pour vider les regles.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FleetMaintenanceRequiredDto)
  maintenanceRequired?: FleetMaintenanceRequiredDto | null;
}
