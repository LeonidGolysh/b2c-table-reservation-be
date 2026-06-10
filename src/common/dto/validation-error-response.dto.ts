import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorResponse {
  @ApiProperty({
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    example: ['email must be an email', 'password should not be empty'],
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
  })
  error: string;
}