import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuoteEvent } from './quote-event.entity';

export enum QuoteStatus {
  NOUVELLE_DEMANDE = 'NOUVELLE_DEMANDE',
  EN_ANALYSE = 'EN_ANALYSE',
  PROPOSITION_ENVOYEE = 'PROPOSITION_ENVOYEE',
  EN_NEGOCIATION = 'EN_NEGOCIATION',
  EN_ATTENTE_PAIEMENT = 'EN_ATTENTE_PAIEMENT',
  PAYEE = 'PAYEE',
  CONVERTI_RESERVATION = 'CONVERTI_RESERVATION',
  REFUSEE = 'REFUSEE',
  ANNULEE = 'ANNULEE',
}

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'public_reference', unique: true })
  publicReference!: string;

  @Column({ type: 'varchar', name: 'requester_type' })
  requesterType!: string;

  @Column({ type: 'varchar', name: 'requester_name' })
  requesterName!: string;

  @Column({ type: 'varchar', name: 'requester_email' })
  requesterEmail!: string;

  @Column({ type: 'varchar', name: 'requester_phone' })
  requesterPhone!: string;

  @Column({ type: 'varchar', name: 'company_name', nullable: true })
  companyName!: string | null;

  @Column({ type: 'varchar', name: 'company_siret', nullable: true })
  companySiret!: string | null;

  @Column({ type: 'varchar', name: 'pickup_city' })
  pickupCity!: string;

  @Column({ type: 'varchar', name: 'requested_vehicle_type' })
  requestedVehicleType!: string;

  @Column({ type: 'integer', name: 'requested_quantity', default: 1 })
  requestedQuantity!: number;

  @Column({ type: 'timestamptz', name: 'start_at' })
  startAt!: Date;

  @Column({ type: 'timestamptz', name: 'end_at' })
  endAt!: Date;

  @Column({ type: 'text', name: 'comment', nullable: true })
  comment!: string | null;

  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.NOUVELLE_DEMANDE,
  })
  status!: QuoteStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'amount_ttc',
    default: 0,
  })
  amountTtc!: string;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: 'varchar', name: 'payment_session_id', nullable: true })
  paymentSessionId!: string | null;

  @Column({ type: 'varchar', name: 'payment_intent_id', nullable: true })
  paymentIntentId!: string | null;

  @Column({ type: 'timestamptz', name: 'payment_paid_at', nullable: true })
  paymentPaidAt!: Date | null;

  @Column({ type: 'jsonb', name: 'requested_vehicles_detail', nullable: true })
  requestedVehiclesDetail!: Array<{ vehicleType: string; startAt: string; endAt: string }> | null;

  @Column({ type: 'jsonb', name: 'proposal_details', nullable: true })
  proposalDetails!: Record<string, unknown> | null;

  @Column({ type: 'text', name: 'proposal_message', nullable: true })
  proposalMessage!: string | null;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', name: 'archived_at', nullable: true })
  archivedAt!: Date | null;

  @OneToMany(() => QuoteEvent, (event) => event.quote, {
    cascade: true,
  })
  events!: QuoteEvent[];
}
