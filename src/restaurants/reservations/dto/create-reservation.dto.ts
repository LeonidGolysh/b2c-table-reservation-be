import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ example: 'johndoe@example.com' })
  @IsEmail()
  @MaxLength(100)
  customerEmail: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  customerPhone?: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @IsPositive()
  guestsCount: number;

  @ApiProperty({
    description:
      'Reservation start time in ISO 8601 format, including timezone',
    example: '2026-10-12T16:00:00+02:00',
  })
  @IsDateString({ strict: true })
  startTime: string;
}
