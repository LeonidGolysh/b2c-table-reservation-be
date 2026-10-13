import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class ReservationEmailDto {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  reservationId: number;

  @ApiProperty({ example: 'Test Restaurant' })
  @IsString()
  restaurantName: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  customerName: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ example: '2026-10-12T12:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  guestsCount: number;
}
