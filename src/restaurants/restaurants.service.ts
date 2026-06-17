import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entity/restaurant.entity';
import { Repository } from 'typeorm';
import { RestaurantAddresses } from './entity/restaurant-addresses.entity';
import { User } from 'src/users/user.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UserRole } from 'src/users/user-role.enum';
import { RestaurantNorFoundException } from './exceptions/restaurant-not-found.exception';
import { ResponseRestaurantDto } from './dto/response-restaurant.dto';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { DataSource } from 'typeorm';

export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,

    @InjectRepository(RestaurantAddresses)
    private addressesRepository: Repository<RestaurantAddresses>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly subscriptionService: SubscriptionsService,

    private readonly dataSource: DataSource,
  ) {}

  private mapToResponse(restaurant: Restaurant): ResponseRestaurantDto {
    return {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      isActive: restaurant.isActive,

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

  async create(dto: CreateRestaurantDto) {
    const owner = await this.userRepository.findOne({
      where: {
        id: dto.owner_id,
      },
    });

    if (!owner) {
      throw new Error('Owner not found');
    }

    if (owner.role !== UserRole.OWNER) {
      throw new Error('Invalid owner');
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
      relations: {
        owner: true,
        addresses: true,
      },
    });

    return restaurants.map((restaurant) => this.mapToResponse(restaurant));
  }

  async findOne(id: number): Promise<ResponseRestaurantDto> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: {
        owner: true,
        addresses: true,
      },
    });

    if (!restaurant) {
      throw new RestaurantNorFoundException(id);
    }

    return this.mapToResponse(restaurant);
  }

  async update(id: number, dto: UpdateRestaurantDto) {
    await this.findOne(id);

    await this.restaurantRepository.update(id, dto);

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.restaurantRepository.delete(id);

    return {
      message: 'Restaurant deleted successfully',
    };
  }
}
