import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateRestaurantAddressesDto } from './create-restaurant-addresses.dto';
import { SubscriptionPlan } from 'src/subscriptions/enum/subscription-plan.enum';
import { SubscriptionRenewalType } from 'src/subscriptions/enum/subscription-renewal-type.enum';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Burger House' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Best burger house' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  owner_id: number;

  @ApiProperty({
    enum: SubscriptionPlan,
    example: SubscriptionPlan.TST,
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ type: CreateRestaurantAddressesDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRestaurantAddressesDto)
  addresses: CreateRestaurantAddressesDto[];

  @ApiProperty({
    enum: SubscriptionRenewalType,
    example: SubscriptionRenewalType.MANUAL,
  })
  @IsEnum(SubscriptionRenewalType)
  renewalType: SubscriptionRenewalType;
}
