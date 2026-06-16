import { ApiProperty } from '@nestjs/swagger';
import { ResponseReviewsDto } from './response-review.dto';

export class PaginatedReviewsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ type: ResponseReviewsDto })
  data: ResponseReviewsDto[];
}
