import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entity/restaurant.entity';
import { FindOptionsRelations, Repository } from 'typeorm';
import { RestaurantAddresses } from './entity/restaurant-addresses.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UserRole } from 'src/users/user-role.enum';
import { RestaurantNotFoundException } from './exceptions/restaurant-not-found.exception';
import { ResponseRestaurantDto } from './dto/response-restaurant.dto';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { SubscriptionNotFoundException } from 'src/subscriptions/exceptions/subscription-not-found.exception';
import { DataSource } from 'typeorm';
import { StripeService } from 'src/stripe/stripe.service';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

// Relations needed to build a ResponseRestaurantDto.
const RESPONSE_RELATIONS: FindOptionsRelations<Restaurant> = {
  owner: true,
  addresses: true,
  subscriptions: true,
};

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,

    @InjectRepository(RestaurantAddresses)
    private addressesRepository: Repository<RestaurantAddresses>,

    private readonly usersService: UsersService,

    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionService: SubscriptionsService,

    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
  ) {}

  private mapToResponse(restaurant: Restaurant): ResponseRestaurantDto {
    return {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      isActive: restaurant.isActive,
      renewalType: restaurant.subscriptions.renewalType,

      owner: {
        id: restaurant.owner.id,
        name: restaurant.owner.name,
        lastname: restaurant.owner.lastname,
      },

      addresses:
        restaurant.addresses.map((address) => ({
          id: address.id,
          country: address.country,
          city: address.city,
          street: address.street,
          buildingNumber: address.buildingNumber,
          latitude: address.latitude,
          longitude: address.longitude,
        })) ?? [],
    };
  }

  private async findByIdOrThrow(
    id: number,
    relations?: FindOptionsRelations<Restaurant>,
  ): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      ...(relations && { relations }),
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException(id);
    }

    return restaurant;
  }

  async create(dto: CreateRestaurantDto) {
    const owner = await this.usersService.findOneEntity(dto.owner_id);

    if (owner.role !== UserRole.OWNER) {
      throw new BadRequestException('User is not registered as an owner');
    }

    const savedId = await this.dataSource.transaction(async (manager) => {
      const restaurant = this.restaurantRepository.create({
        name: dto.name,
        description: dto.description,
        owner,
      });

      const savedRestaurant = await manager.save(restaurant);

      await this.subscriptionService.createForRestaurant(
        savedRestaurant,
        dto.plan,
        dto.renewalType,
        manager,
      );

      const addresses = dto.addresses.map((address) =>
        this.addressesRepository.create({
          ...address,
          restaurant: savedRestaurant,
        }),
      );

      await manager.save(addresses);

      return savedRestaurant.id;
    });

    return this.findOne(savedId);
  }

  async findAll(): Promise<ResponseRestaurantDto[]> {
    const restaurants = await this.restaurantRepository.find({
      relations: RESPONSE_RELATIONS,
    });

    return restaurants.map((restaurant) => this.mapToResponse(restaurant));
  }

  async findOne(id: number): Promise<ResponseRestaurantDto> {
    const restaurant = await this.findByIdOrThrow(id, RESPONSE_RELATIONS);

    return this.mapToResponse(restaurant);
  }

  async findOneEntity(id: number): Promise<Restaurant> {
    return this.findByIdOrThrow(id);
  }

  // Finds a restaurant only if it belongs to the given owner, so one owner
  // can't read another owner's data.
  async findOwnedByIdOrThrow(
    id: number,
    ownerId: number,
    relations?: FindOptionsRelations<Restaurant>,
  ): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id, owner: { id: ownerId } },
      ...(relations && { relations }),
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException(id);
    }

    return restaurant;
  }

  async findAllByOwner(
    ownerId: number,
    relations?: FindOptionsRelations<Restaurant>,
  ): Promise<Restaurant[]> {
    return this.restaurantRepository.find({
      where: { owner: { id: ownerId } },
      ...(relations && { relations }),
      order: { createdAt: 'ASC' },
    });
  }

  async setActive(id: number, isActive: boolean): Promise<void> {
    await this.restaurantRepository.update(id, { isActive });
  }

  async recordRating(id: number, rate: number): Promise<void> {
    const restaurant = await this.findOneEntity(id);
    const ratingCount = restaurant.ratingCount + 1;
    const avgRating =
      (restaurant.avgRating * restaurant.ratingCount + rate) / ratingCount;

    await this.restaurantRepository.update(id, { ratingCount, avgRating });
  }

  async update(id: number, dto: UpdateRestaurantDto) {
    await this.findByIdOrThrow(id);

    await this.restaurantRepository.update(id, dto);

    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.restaurantRepository.delete(id);

    if (!result.affected) {
      throw new RestaurantNotFoundException(id);
    }

    return {
      message: 'Restaurant deleted successfully',
    };
  }

  async checkout(restaurantId: number) {
    const restaurant = await this.findByIdOrThrow(restaurantId, {
      subscriptions: true,
    });

    if (!restaurant.subscriptions) {
      throw new SubscriptionNotFoundException();
    }

    const subscription = await this.subscriptionService.startCheckout(
      restaurant.subscriptions.id,
    );

    const session =
      await this.stripeService.createCheckoutSession(subscription);

    return {
      checkoutUrl: session.url,
    };
  }
}
