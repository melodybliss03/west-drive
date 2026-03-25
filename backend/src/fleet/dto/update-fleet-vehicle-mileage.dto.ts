import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateFleetVehicleMileageDto {
  @ApiProperty({
    example: 52340,
    description: 'Kilometrage total du vehicule en km',
  })
  @IsInt()
  @Min(0)
  mileage!: number;
}
