import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginatedReviewsResponseDto } from './dto/paginated-reviews-response.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';

@Controller('restaurants/:restaurantId/reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  @ApiOperation({
    summary: 'Add rate with comment',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(
    @Param('restaurantId') restaurantId: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewService.create(user.userId, Number(restaurantId), dto);
  }

  @ApiOperation({
    summary: 'Get restaurant review',
  })
  @ApiResponse({
    status: 200,
    type: PaginatedReviewsResponseDto,
  })
  @Get()
  findByRestaurant(
    @Param('restaurantId') restaurantId: number,
    @Query() query: GetReviewsQueryDto,
  ) {
    return this.reviewService.findByRestaurant(Number(restaurantId), query);
  }

  @ApiOperation({
    summary: 'Delete comment',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully',
    schema: {
      example: {
        message: 'Comment deleted successfully',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
    type: ErrorResponseDto,
  })
  @Delete(':id')
  remove(@Param('id') id: number): Promise<{ message: string }> {
    return this.reviewService.remove(+id);
  }
}
