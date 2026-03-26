import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StartQuoteNegotiationDto {
  @ApiPropertyOptional({
    description: 'Message commercial optionnel envoye au client au debut de la negociation',
    example: 'Nous pouvons ajuster la proposition selon vos contraintes.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
