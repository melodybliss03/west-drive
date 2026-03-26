import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmQuotePaymentDto {
  @ApiProperty({ example: 'cs_test_123' })
  @IsString()
  sessionId!: string;
}
