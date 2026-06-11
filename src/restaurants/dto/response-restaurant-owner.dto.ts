import { ApiProperty } from '@nestjs/swagger';

export class ResponseRestaurantOwnerDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  name: string;

  @ApiProperty({ example: 'Doe' })
  lastname: string;
}
