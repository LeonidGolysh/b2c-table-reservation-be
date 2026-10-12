import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../enum/reservation-status.enum';
import { IsEnum } from 'class-validator';

export class UpdateReservationStatusDto {
  @ApiProperty({
    enum: ReservationStatus,
    example: ReservationStatus.CANCELED,
  })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
