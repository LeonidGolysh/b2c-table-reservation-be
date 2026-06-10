import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  name: string;

  @ApiProperty({ example: 'Doe' })
  lastname: string;

  @ApiProperty({ example: '1234567890' })
  phone_number: string;

  @ApiProperty({ example: 'john@gmail.com' })
  email: string;

  @ApiProperty({ example: '1234' })
  password: string;

  @ApiProperty({ example: 'USR' })
  role: string;
}
