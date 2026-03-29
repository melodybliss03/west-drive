import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ActivateAccountDto {
  @ApiProperty({
    description: 'Email du compte a activer',
    example: 'client@westdrive.fr',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Code OTP a 6 chiffres present dans le lien d activation',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  otp!: string;

  @ApiProperty({
    description: 'Mot de passe definitif du compte',
    example: 'NouveauMotDePasseTresFort123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
