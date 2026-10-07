import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SubscriptionPaymentReminderEmailDto {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Bob' })
  @IsOptional()
  @IsString()
  customerName: string;

  @ApiProperty({ example: 'Test restaurant' })
  @IsString()
  restaurantName: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'PLN' })
  @IsString()
  currency: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z'})
  @IsDateString()
  billingDate: string;
}
