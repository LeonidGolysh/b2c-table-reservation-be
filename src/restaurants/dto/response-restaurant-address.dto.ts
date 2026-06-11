import { ApiProperty } from '@nestjs/swagger';

export class ResponseRestaurantAddressDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Poland' })
  country: string;

  @ApiProperty({ example: 'Warsaw' })
  city: string;

  @ApiProperty({ example: 'Railway' })
  street: string;

  @ApiProperty({ example: '15A' })
  buildingNumber: string;

  @ApiProperty({ example: 52.2297 })
  latitude: number;

  @ApiProperty({ example: 21.0122 })
  longitude: number;
}
