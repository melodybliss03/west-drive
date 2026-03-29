import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ type: 'uuid', name: 'vehicle_id', nullable: true })
  vehicleId!: string | null;

  @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle | null;

  @Column({ type: 'uuid', name: 'reservation_id', nullable: true, unique: true })
  reservationId!: string | null;

  @ManyToOne(() => Reservation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservation_id' })
  reservation!: Reservation | null;

  @Column({ type: 'varchar', name: 'author_name' })
  authorName!: string;

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @Column({ type: 'int', default: 5 })
  rating!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  source!: string | null;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PUBLISHED,
  })
  status!: ReviewStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
