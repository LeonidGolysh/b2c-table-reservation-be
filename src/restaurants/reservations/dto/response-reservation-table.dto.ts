import { ApiProperty } from '@nestjs/swagger';

export class ResponseReservationTableDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  tableNumber: number;

  @ApiProperty({ example: 2 })
  seats: number;
}
