import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRestaurantAddressesDto {
  @ApiProperty({ example: 'Poland' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'Warsaw' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Railway' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: '15A' })
  @IsString()
  @IsNotEmpty()
  buildingNumber: string;

  @ApiProperty({ example: 52.2297 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 21.0122 })
  @IsNumber()
  longitude: number;
}
