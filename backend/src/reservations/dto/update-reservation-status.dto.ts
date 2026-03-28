import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class UpdateReservationStatusDto {
  @ApiProperty({
    enum: ReservationStatus,
    example: ReservationStatus.EN_ATTENTE_PAIEMENT,
  })
  @IsEnum(ReservationStatus)
  status!: ReservationStatus;

  @ApiProperty({
    required: false,
    description: 'Commentaire optionnel envoye au client avec la mise a jour de statut',
    example: 'Votre vehicule est pret au retrait a partir de 14h.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
