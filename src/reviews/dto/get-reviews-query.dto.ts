import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class GetReviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['latest', 'oldest', 'rating_asc', 'rating_desc'],
    example: 'latest',
  })
  @IsOptional()
  @IsIn(['latest', 'oldest', 'rating_asc', 'rating_desc'])
  sort?: 'latest' | 'oldest' | 'rating_asc' | 'rating_desc' = 'latest';
}
