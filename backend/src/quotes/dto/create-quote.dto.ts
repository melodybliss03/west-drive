import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({ example: 'PARTICULIER' })
  @IsString()
  requesterType!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  requesterName!: string;

  @ApiProperty({ example: 'john.doe@email.com' })
  @IsEmail()
  requesterEmail!: string;

  @ApiProperty({ example: '+33612345678' })
  @IsString()
  requesterPhone!: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: '12345678901234' })
  @IsOptional()
  @IsString()
  companySiret?: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  pickupCity!: string;

  @ApiProperty({ example: 'SUV' })
  @IsString()
  requestedVehicleType!: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requestedQuantity!: number;

  @ApiProperty({ example: '2026-04-20T08:00:00Z' })
  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @ApiProperty({ example: '2026-04-25T18:00:00Z' })
  @Type(() => Date)
  @IsDate()
  endAt!: Date;

  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  comment?: string;
}
