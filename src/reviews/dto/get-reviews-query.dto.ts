import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetReviewsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ['latest', 'oldest', 'rating_asc', 'rating_desc'],
    example: 'latest',
  })
  @IsOptional()
  @IsIn(['latest', 'oldest', 'rating_asc', 'rating_desc'])
  sort?: 'latest' | 'oldest' | 'rating_asc' | 'rating_desc' = 'latest';
}
