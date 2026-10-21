import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ResponseUserDto } from './dto/response-user.dto';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  getPaginationOptions,
  toPaginatedResponse,
} from 'src/common/utils/pagination.util';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { AccountKind } from 'src/auth/enum/account-kind.enum';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';
import type { AuthUser } from 'src/auth/strategies/jwt/interface/user.request.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private mapToResponse(user: User): ResponseUserDto {
    return {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      phoneNumber: user.phoneNumber,
      email: user.email,
    };
  }

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      name: dto.name,
      lastname: dto.lastname,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    return this.mapToResponse(savedUser);
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found with email: ', email);
    }

    return user;
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ResponseUserDto>> {
    const [users, total] = await this.userRepository.findAndCount({
      ...getPaginationOptions(query),
      order: {
        id: 'ASC',
      },
    });

    return toPaginatedResponse(
      users.map((user) => this.mapToResponse(user)),
      total,
      query,
    );
  }

  async findOne(id: number): Promise<ResponseUserDto> {
    return this.mapToResponse(await this.findOneEntity(id));
  }

  async findOneEntity(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new UserNotFoundException(id);
    }

    return user;
  }

  // Admins can update any user; customers only themselves.
  private assertCanManage(id: number, actor: AuthUser) {
    if (actor.role === WorkerRole.ADMIN) {
      return;
    }

    if (actor.kind !== AccountKind.USER || actor.userId !== id) {
      throw new UserNotFoundException(id);
    }
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    actor: AuthUser,
  ): Promise<ResponseUserDto> {
    this.assertCanManage(id, actor);
    await this.findOneEntity(id);

    const data: Partial<User> = { ...dto };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    await this.userRepository.update(id, data);

    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.userRepository.delete(id);

    if (!result.affected) {
      throw new UserNotFoundException(id);
    }

    return {
      message: 'User removed successfully',
    };
  }
}
