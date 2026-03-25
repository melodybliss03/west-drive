import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'uuid', name: 'recipient_user_id', nullable: true })
  @Index('IDX_notifications_recipient_user_id')
  recipientUserId!: string | null;

  @Column({ type: 'varchar', name: 'recipient_role', nullable: true })
  @Index('IDX_notifications_recipient_role')
  recipientRole!: string | null;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  @Index('IDX_notifications_is_read')
  isRead!: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
