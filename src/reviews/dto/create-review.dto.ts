import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rate: number;

  @ApiProperty({ example: 'Good' })
  @MaxLength(255)
  comment: string;
}
