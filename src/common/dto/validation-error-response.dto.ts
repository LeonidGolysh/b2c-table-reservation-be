import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorResponse {
  @ApiProperty({
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    example: ['name should not be empty', 'name must be a string'],
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
  })
  error: string;
}
