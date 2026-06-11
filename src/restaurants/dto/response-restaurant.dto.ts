import { ApiProperty } from '@nestjs/swagger';
import { ResponseRestaurantOwnerDto } from './response-restaurant-owner.dto';
import { ResponseRestaurantAddressDto } from './response-restaurant-address.dto';

export class ResponseRestaurantDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Burger House' })
  name: string;

  @ApiProperty({ example: 'Best burger house' })
  description?: string;

  @ApiProperty({ type: ResponseRestaurantOwnerDto })
  owner: ResponseRestaurantOwnerDto;

  @ApiProperty({ type: ResponseRestaurantAddressDto, isArray: true })
  addresses: ResponseRestaurantAddressDto[];
}
