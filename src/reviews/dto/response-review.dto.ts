import { ApiProperty } from '@nestjs/swagger';

class ReviewUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  name: string;

  @ApiProperty({ example: 'Doe' })
  lastname: string;
}

export class ResponseReviewsDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 5 })
  rate: number;

  @ApiProperty({ example: 'Good' })
  comment: string;

  @ApiProperty({ type: ReviewUserDto })
  user: ReviewUserDto;

  @ApiProperty({ example: '2026-06-12T16:30:20.365Z' })
  createdAt: Date;
}
