import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ResponseUserDto } from './dto/response-user.dto';
import { UserNotFountException } from './exceptions/user-not-found.exception';
import { UserRole } from './user-role.enum';

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
      phone_number: user.phone_number,
      email: user.email,
    };
  }

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      name: dto.name,
      lastname: dto.lastname,
      phone_number: dto.phone_number,
      email: dto.email,
      password: hashedPassword,
      role: dto.role ?? UserRole.USER,
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

  async findAll(): Promise<ResponseUserDto[]> {
    const users = await this.userRepository.find();

    return users.map((users) => this.mapToResponse(users));
  }

  async findOne(id: number): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new UserNotFountException(id);
    }

    return this.mapToResponse(user);
  }

  async findOneEntity(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new UserNotFountException(id);
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<ResponseUserDto> {
    await this.userRepository.update(id, dto);

    const updateUser = await this.userRepository.findOne({
      where: { id },
    });

    if (!updateUser) {
      throw new UserNotFountException(id);
    }

    return this.mapToResponse(updateUser);
  }

  async remove(id: number) {
    const user = await this.userRepository.delete(id);

    if (!user) {
      throw new UserNotFountException(id);
    }

    return {
      message: 'User removed successfully',
    };
  }
}
