import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleOperationalStatus } from '../entities/vehicle.entity';

class CreateVehicleImageDto {
  @ApiProperty({
    example: 'https://cdn.westdrive.fr/vehicles/model-x/front.jpg',
  })
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class AdditionalFeeLabelDto {
  @ApiProperty({ example: 'Nettoyage premium' })
  @IsString()
  label!: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  amount!: number;
}

class MaintenanceRequiredDto {
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

export class CreateVehicleDto {
  @ApiProperty({ example: 'Tesla Model X 2024' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Tesla' })
  @IsString()
  brand!: string;

  @ApiProperty({ example: 'Model X' })
  @IsString()
  model!: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  year!: number;

  @ApiProperty({ example: 'SUV' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 'AUTOMATIQUE' })
  @IsString()
  transmission!: string;

  @ApiProperty({ example: 'ELECTRIQUE' })
  @IsString()
  energy!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isHybride?: boolean;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  seats!: number;

  @ApiProperty({ example: 200 })
  @IsInt()
  @Min(0)
  includedKmPerDay!: number;

  @ApiProperty({ example: 159.99 })
  @IsNumber()
  @Min(0)
  pricePerDay!: number;

  @ApiPropertyOptional({ example: 18.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerHour?: number;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({ example: 45200 })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ example: 'SUV premium 7 places, parfait pour les longs trajets.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'AB-123-CD' })
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 4.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reviewCount?: number;

  @ApiPropertyOptional({ enum: VehicleOperationalStatus })
  @IsOptional()
  @IsEnum(VehicleOperationalStatus)
  operationalStatus?: VehicleOperationalStatus;

  @ApiPropertyOptional({ type: [String], example: ['Paris', 'Nanterre'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableCities?: string[];

  @ApiProperty({ example: '12 Rue de Rivoli' })
  @IsString()
  streetAddress!: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  city!: string;

  @ApiPropertyOptional({ example: 48.856614 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 2.3522219 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ type: [AdditionalFeeLabelDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalFeeLabelDto)
  additionalFeesLabels?: AdditionalFeeLabelDto[];

  @ApiPropertyOptional({ type: MaintenanceRequiredDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MaintenanceRequiredDto)
  maintenanceRequired?: MaintenanceRequiredDto;

  @ApiPropertyOptional({ type: [CreateVehicleImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleImageDto)
  images?: CreateVehicleImageDto[];
}
