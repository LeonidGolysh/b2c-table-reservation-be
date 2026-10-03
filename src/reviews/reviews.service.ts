import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { FindOptionsOrder, Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserRole } from 'src/users/user-role.enum';
import { ResponseReviewsDto } from './dto/response-review.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { UsersService } from 'src/users/users.service';

const REVIEW_SORT_ORDER: Record<
  NonNullable<GetReviewsQueryDto['sort']>,
  FindOptionsOrder<Review>
> = {
  latest: { createdAt: 'DESC' },
  oldest: { createdAt: 'ASC' },
  rating_asc: { rate: 'ASC' },
  rating_desc: { rate: 'DESC' },
};

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,

    private readonly restaurantsService: RestaurantsService,
    private readonly usersService: UsersService,
  ) {}

  private mapToResponse(review: Review): ResponseReviewsDto {
    return {
      id: review.id,
      rate: review.rate,
      comment: review.comment,
      createdAt: review.createdAt,

      user: {
        id: review.user.id,
        name: review.user.name,
        lastname: review.user.lastname,
      },
    };
  }

  async create(userId: number, restaurantId: number, dto: CreateReviewDto) {
    const restaurant =
      await this.restaurantsService.findOneEntity(restaurantId);
    const user = await this.usersService.findOneEntity(userId);

    if (user.role !== UserRole.USER) {
      throw new ForbiddenException('Only users can leave reviews');
    }

    const existing = await this.reviewRepository.findOne({
      where: {
        user: { id: userId },
        restaurant: { id: restaurantId },
      },
    });

    if (existing) {
      throw new BadRequestException('You already reviewed this restaurant');
    }

    const review = this.reviewRepository.create({
      rate: dto.rate,
      comment: dto.comment,
      user,
      restaurant,
    });

    const savedReview = await this.reviewRepository.save(review);

    await this.restaurantsService.recordRating(restaurantId, dto.rate);

    const reviewWithRelations = await this.reviewRepository.findOne({
      where: {
        id: savedReview.id,
      },
      relations: {
        user: true,
      },
    });

    if (!reviewWithRelations) {
      throw new NotFoundException('Review not found');
    }

    return this.mapToResponse(reviewWithRelations);
  }

  async findByRestaurant(restaurantId: number, query: GetReviewsQueryDto) {
    const { page = 1, limit = 10, sort = 'latest' } = query;

    const order = REVIEW_SORT_ORDER[sort];

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: {
        restaurant: {
          id: restaurantId,
        },
      },
      relations: {
        user: true,
      },
      order,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: reviews.map((review) => this.mapToResponse(review)),
      total,
      page,
      limit,
    };
  }

  async remove(id: number) {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Comment not found');
    }

    await this.reviewRepository.delete(id);

    return {
      message: 'Comment removed successfully',
    };
  }
}
