import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Worker } from './worker.entity';
import { WorkerRole } from './enum/worker-role.enum';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { ResponseWorkerDto } from './dto/response-worker.dto';
import { WorkerNotFoundException } from './exceptions/worker-not-found.exception';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import {
  getPaginationOptions,
  toPaginatedResponse,
} from 'src/common/utils/pagination.util';

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(Worker)
    private workerRepository: Repository<Worker>,
  ) {}

  mapToResponse(worker: Worker): ResponseWorkerDto {
    return {
      id: worker.id,
      name: worker.name,
      lastname: worker.lastname,
      phone_number: worker.phone_number,
      email: worker.email,
      role: worker.role,
      restaurantId: worker.restaurantId,
    };
  }

  // Owners and admins are created without a restaurant; managers and staff
  // must be given the restaurant they work at.
  async create(
    dto: CreateWorkerDto,
    role: WorkerRole,
    restaurant: Restaurant | null = null,
  ): Promise<ResponseWorkerDto> {
    const exists = await this.workerRepository.existsBy({ email: dto.email });

    if (exists) {
      throw new ConflictException(
        `Worker with email ${dto.email} already exists`,
      );
    }

    const worker = this.workerRepository.create({
      name: dto.name,
      lastname: dto.lastname,
      phone_number: dto.phone_number,
      email: dto.email,
      password: await bcrypt.hash(dto.password, 10),
      role,
      restaurant,
    });

    const savedWorker = await this.workerRepository.save(worker);

    return this.mapToResponse(savedWorker);
  }

  // Password is excluded from selects by default, so login asks for it here.
  async findByEmailWithPassword(email: string): Promise<Worker | null> {
    return this.workerRepository
      .createQueryBuilder('worker')
      .addSelect('worker.password')
      .where('worker.email = :email', { email })
      .getOne();
  }

  async findOneEntity(id: number): Promise<Worker> {
    const worker = await this.workerRepository.findOne({ where: { id } });

    if (!worker) {
      throw new WorkerNotFoundException(id);
    }

    return worker;
  }

  async findOne(id: number): Promise<ResponseWorkerDto> {
    return this.mapToResponse(await this.findOneEntity(id));
  }

  async findByRestaurant(
    restaurantId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ResponseWorkerDto>> {
    const [workers, total] = await this.workerRepository.findAndCount({
      where: { restaurantId },
      ...getPaginationOptions(query),
      order: { id: 'ASC' },
    });

    return toPaginatedResponse(
      workers.map((worker) => this.mapToResponse(worker)),
      total,
      query,
    );
  }

  async removeFromRestaurant(
    restaurantId: number,
    workerId: number,
  ): Promise<void> {
    const result = await this.workerRepository.delete({
      id: workerId,
      restaurantId,
    });

    if (!result.affected) {
      throw new WorkerNotFoundException(workerId);
    }
  }
}
