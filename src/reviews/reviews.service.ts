import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { Repository } from 'typeorm';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { User } from 'src/users/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserRole } from 'src/users/user-role.enum';
import { ResponseReviewsDto } from './dto/response-review.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,

    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant nor found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

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

    const oldCount = restaurant.ratingCount;
    const oldAvg = restaurant.avgRating;

    const newCount = oldCount + 1;

    restaurant.ratingCount = newCount;
    restaurant.avgRating = (oldAvg * oldCount + dto.rate) / newCount;

    await this.restaurantRepository.save(restaurant);

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

    let order: any;

    switch (sort) {
      case 'oldest':
        order = {
          createdAt: 'ASC',
        };
        break;
      case 'rating_asc':
        order = {
          rate: 'ASC',
        };
        break;

      case 'rating_desc':
        order = {
          rate: 'DESC',
        };
        break;

      default:
        order = {
          createdAt: 'DESC',
        };
    }

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
