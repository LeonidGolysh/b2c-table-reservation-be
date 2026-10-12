import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../enum/reservation-status.enum';
import { ResponseReservationTableDto } from './response-reservation-table.dto';

export class ResponseReservationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  restaurantId: number;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ example: 'johndoe@example.com' })
  customerEmail: string;

  @ApiPropertyOptional({ example: '1234567890', nullable: true })
  customerPhone: string | null;

  @ApiProperty({ example: 3 })
  guestsCount: number;

  @ApiProperty({ example: '2026-10-15T16:00:00.000Z', type: String })
  startTime: Date;

  @ApiProperty({ example: 120 })
  durationMinutes: number;

  @ApiProperty({ example: 60 })
  bufferMinutes: number;

  @ApiProperty({
    enum: ReservationStatus,
    example: ReservationStatus.CONFIRMED,
  })
  status: ReservationStatus;

  @ApiProperty({ example: '2026-10-15T16:00:00.000Z', type: String })
  createdAt: Date;

  @ApiProperty({ type: [ResponseReservationTableDto] })
  tables: ResponseReservationTableDto[];
}
