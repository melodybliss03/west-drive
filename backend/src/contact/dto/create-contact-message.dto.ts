import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'jean.dupont@email.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+33601020304' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: 'Demande de disponibilite' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject!: string;

  @ApiProperty({ example: 'Bonjour, je souhaite connaitre vos disponibilites pour ce weekend.' })
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;
}
