import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AssignRoleByEmailDto {
  @ApiProperty({
    example: 'ops@westdrive.fr',
    description: 'Adresse email de la personne a inviter et a qui attribuer le role',
  })
  @IsEmail()
  email!: string;
}
