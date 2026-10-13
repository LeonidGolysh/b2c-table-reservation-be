import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReservationStatus } from '../enum/reservation-status.enum';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { ReservationTable } from './reservation-table.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_name', type: 'varchar', length: 100 })
  customerName: string;

  @Column({ name: 'customer_email', type: 'varchar', length: 100 })
  customerEmail: string;

  @Column({
    name: 'customer_number',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  customerPhone: string | null;

  @Column({ name: 'guests_count', type: 'int' })
  guestsCount: number;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  // Estimated duration, in minutes
  @Column({ name: 'duration_minutes', type: 'int', default: 120 })
  durationMinutes: number;

  // Allow time for cleaning and preparation
  @Column({ name: 'buffer_minutes', type: 'int', default: 60 })
  bufferMinutes: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  @OneToMany(
    () => ReservationTable,
    (reservationTable) => reservationTable.reservation,
    { cascade: ['insert'] },
  )
  reservationTables: ReservationTable[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index({ unique: true })
  @Column({
    name: 'check_in_token_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  checkInTokenHash: string | null;
}
