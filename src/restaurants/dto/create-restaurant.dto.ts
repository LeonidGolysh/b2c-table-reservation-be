import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateRestaurantAddressesDto } from './create-restaurant-addresses.dto';

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

  @ApiProperty({ type: CreateRestaurantAddressesDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRestaurantAddressesDto)
  addresses: CreateRestaurantAddressesDto[];
}
