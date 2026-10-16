import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entity/restaurant.entity';
import { FindOptionsRelations, Repository } from 'typeorm';
import { RestaurantAddresses } from './entity/restaurant-addresses.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantNotFoundException } from './exceptions/restaurant-not-found.exception';
import { ResponseRestaurantDto } from './dto/response-restaurant.dto';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { DataSource } from 'typeorm';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WorkersService } from 'src/workers/workers.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  getPaginationOptions,
  toPaginatedResponse,
} from 'src/common/utils/pagination.util';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { OnboardingStatus } from './enum/onboarding-status.emun';
import { AccountKind } from 'src/auth/enum/account-kind.enum';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';
import type { AuthUser } from 'src/auth/strategies/jwt/interface/user.request.interface';

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

    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionService: SubscriptionsService,

    private readonly dataSource: DataSource,
    private readonly workersService: WorkersService,
  ) {}

  private mapToResponse(restaurant: Restaurant): ResponseRestaurantDto {
    return {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      isActive: restaurant.isActive,
      renewalType: restaurant.subscriptions.renewalType,
      onboardingStatus: restaurant.onboardingStatus,

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

  // The owner comes from the access token (routes allow only OWNER), so an
  // owner can't create a restaurant on someone else's behalf.
  async create(ownerId: number, dto: CreateRestaurantDto) {
    const owner = await this.workersService.findOneEntity(ownerId);

    const savedId = await this.dataSource.transaction(async (manager) => {
      const restaurant = this.restaurantRepository.create({
        name: dto.name,
        description: dto.description,
        owner,
        onboardingStatus: OnboardingStatus.IN_PROGRESS,
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

  async markPending(restaurantId: number): Promise<void> {
    await this.restaurantRepository.update(
      {
        id: restaurantId,
        onboardingStatus: OnboardingStatus.IN_PROGRESS,
      },
      {
        onboardingStatus: OnboardingStatus.PAYMENT_PENDING,
      },
    );
  }

  async completeOnboarding(restaurantId: number): Promise<void> {
    await this.restaurantRepository.update(
      {
        id: restaurantId,
        onboardingStatus: OnboardingStatus.PAYMENT_PENDING,
      },
      {
        onboardingStatus: OnboardingStatus.COMPLETED,
      },
    );
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ResponseRestaurantDto>> {
    const [restaurants, total] = await this.restaurantRepository.findAndCount({
      relations: RESPONSE_RELATIONS,
      ...getPaginationOptions(query),
      order: {
        id: 'ASC',
      },
    });

    return toPaginatedResponse(
      restaurants.map((restaurant) => this.mapToResponse(restaurant)),
      total,
      query,
    );
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

  // Finds a restaurant the given worker may operate: the owner's own
  // restaurant, or the one a manager/staff member is employed at.
  async findAccessibleOrThrow(
    id: number,
    actor: AuthUser,
  ): Promise<Restaurant> {
    if (actor.kind !== AccountKind.WORKER) {
      throw new RestaurantNotFoundException(id);
    }

    const restaurant = await this.restaurantRepository.findOne({
      where:
        actor.role === WorkerRole.OWNER
          ? { id, owner: { id: actor.userId } }
          : { id, employees: { id: actor.userId } },
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
}
