import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RestaurantTable } from './entity/restaurant-table.entity';
import { Repository } from 'typeorm';
import { RestaurantsService } from '../restaurants.service';
import { CreateRestaurantTableDto } from './dto/create-restaurant-table.dto';
import { UpdateRestaurantTableDto } from './dto/update-restaurant-table.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  getPaginationOptions,
  toPaginatedResponse,
} from 'src/common/utils/pagination.util';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';

@Injectable()
export class RestaurantTablesService {
  constructor(
    @InjectRepository(RestaurantTable)
    private restaurantTableRepository: Repository<RestaurantTable>,

    private readonly restaurantService: RestaurantsService,
  ) {}

  async create(
    restaurantId,
    ownerId,
    dto: CreateRestaurantTableDto,
  ): Promise<RestaurantTable> {
    const restaurant = await this.restaurantService.findByIdAndOwner(
      restaurantId,
      ownerId,
    );

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const existingTable = await this.restaurantTableRepository.findOne({
      where: {
        restaurant: {
          id: restaurantId,
        },
        tableNumber: dto.tableNumber,
      },
    });

    if (existingTable) {
      throw new ConflictException(
        `Table number ${dto.tableNumber} already exists in this restaurant`,
      );
    }

    const table = this.restaurantTableRepository.create({
      tableNumber: dto.tableNumber,
      seat: dto.seat,
      restaurant,
    });

    return this.restaurantTableRepository.save(table);
  }

  async findAll(
    restaurantId: number,
    ownerId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<RestaurantTable>> {
    const restaurant = await this.restaurantService.findByIdAndOwner(
      restaurantId,
      ownerId,
    );

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const [tables, total] = await this.restaurantTableRepository.findAndCount({
      where: {
        restaurant: {
          id: restaurantId,
        },
      },
      ...getPaginationOptions(query),
      order: {
        tableNumber: 'ASC',
      },
    });

    return toPaginatedResponse(tables, total, query);
  }

  async findOne(
    restaurantId: number,
    tableId: number,
    ownerId: number,
  ): Promise<RestaurantTable> {
    const restaurant = await this.restaurantService.findByIdAndOwner(
      restaurantId,
      ownerId,
    );

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const table = await this.restaurantTableRepository.findOne({
      where: {
        id: tableId,
        restaurant: {
          id: restaurantId,
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  async update(
    restaurantId: number,
    tableId: number,
    ownerId: number,
    dto: UpdateRestaurantTableDto,
  ): Promise<RestaurantTable> {
    const table = await this.findOne(restaurantId, tableId, ownerId);

    if (
      dto.tableNumber !== undefined &&
      dto.tableNumber !== table.tableNumber
    ) {
      const existingTable = await this.restaurantTableRepository.findOne({
        where: {
          restaurant: {
            id: restaurantId,
          },
          tableNumber: dto.tableNumber,
        },
      });

      if (existingTable) {
        throw new ConflictException(
          `Table number ${dto.tableNumber} already exists`,
        );
      }
    }

    Object.assign(table, dto);

    return this.restaurantTableRepository.save(table);
  }

  async remove(
    restaurantId: number,
    tableId: number,
    ownerId: number,
  ): Promise<void> {
    const table = await this.findOne(restaurantId, tableId, ownerId);

    await this.restaurantTableRepository.remove(table);
  }
}
