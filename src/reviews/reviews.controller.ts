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
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CustomerGuard } from 'src/auth/guards/account-kind.guard';
import { ResponseReviewsDto } from './dto/response-review.dto';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { ApiPaginatedResponse } from 'src/common/decorator/api-paginated-response.decorator';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import type { AuthUser } from 'src/auth/strategies/jwt/interface/user.request.interface';

@Controller('restaurants/:restaurantId/reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  @ApiOperation({
    summary: 'Add rate with comment',
  })
  // Only customers can leave reviews, never business accounts.
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @Post()
  create(
    @Param('restaurantId') restaurantId: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reviewService.create(user.userId, Number(restaurantId), dto);
  }

  @ApiOperation({
    summary: 'Get restaurant review',
  })
  @ApiPaginatedResponse(ResponseReviewsDto)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findByRestaurant(
    @Param('restaurantId') restaurantId: number,
    @Query() query: GetReviewsQueryDto,
  ): Promise<PaginatedResponse<ResponseReviewsDto>> {
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
