import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum CustomerQuoteResponseAction {
  ACCEPTER = 'ACCEPTER',
  REFUSER = 'REFUSER',
  CONTRE_PROPOSITION = 'CONTRE_PROPOSITION',
}

export class CustomerQuoteResponseDto {
  @ApiProperty({
    enum: CustomerQuoteResponseAction,
    description: 'Action du client sur la proposition de devis',
  })
  @IsEnum(CustomerQuoteResponseAction)
  action!: CustomerQuoteResponseAction;

  @ApiPropertyOptional({
    description: 'Commentaire client (obligatoire pour refus/contre-proposition)',
    example: 'Je prefere un SUV et un budget a 900 EUR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
