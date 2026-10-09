import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateRestaurantTableDto {
  @ApiProperty({
    description: 'Table number within the restaurant',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @IsNotEmpty()
  tableNumber?: number;

  @ApiProperty({
    description: 'Number of seat at the table',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @IsNotEmpty()
  seat?: number;
}
