import { Injectable } from '@nestjs/common';
import { RestaurantsService } from '../restaurants.service';
import { WorkersService } from 'src/workers/workers.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ResponseWorkerDto } from 'src/workers/dto/response-worker.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly workersService: WorkersService,
  ) {}

  async create(
    restaurantId: number,
    ownerId: number,
    dto: CreateEmployeeDto,
  ): Promise<ResponseWorkerDto> {
    const restaurant = await this.restaurantsService.findOwnedByIdOrThrow(
      restaurantId,
      ownerId,
    );

    return this.workersService.create(dto, dto.role, restaurant);
  }

  async findAll(
    restaurantId: number,
    ownerId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ResponseWorkerDto>> {
    await this.restaurantsService.findOwnedByIdOrThrow(restaurantId, ownerId);

    return this.workersService.findByRestaurant(restaurantId, query);
  }

  async remove(
    restaurantId: number,
    employeeId: number,
    ownerId: number,
  ): Promise<{ message: string }> {
    await this.restaurantsService.findOwnedByIdOrThrow(restaurantId, ownerId);

    await this.workersService.removeFromRestaurant(restaurantId, employeeId);

    return {
      message: 'Employee removed successfully',
    };
  }
}
