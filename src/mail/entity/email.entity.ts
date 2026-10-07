import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmailType } from '../enum/email-type.enum';
import { EmailStatus } from '../enum/email-status.enum';

@Entity('emails')
@Index(['providerMessageId'])
@Index(['recipientEmail'])
export class Email {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, name: 'recipient_emails' })
  recipientEmail: string;

  @Column({
    type: 'enum',
    enum: EmailType,
  })
  type: EmailType;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.SENDING,
  })
  status: EmailStatus;

  @Column({
    name: 'provider_massage_id',
    type: 'varchar',
    nullable: true,
  })
  providerMessageId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
