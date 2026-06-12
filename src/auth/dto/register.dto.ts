import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'bob@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'Bob' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Bib' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  phone_number: string;
}
