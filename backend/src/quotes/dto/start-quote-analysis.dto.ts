import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StartQuoteAnalysisDto {
  @ApiPropertyOptional({
    description: 'Commentaire interne/client optionnel lors du passage en analyse',
    example: 'Votre demande est en cours d etude par notre equipe.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
