import { ApiProperty } from '@nestjs/swagger';

export class ResponseCurrentUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  name: string;

  @ApiProperty({ example: 'Doe' })
  lastname: string;

  @ApiProperty({ example: '1234567890' })
  phone_number: string;

  @ApiProperty({ example: 'john@gmail.com' })
  email: string;
}
