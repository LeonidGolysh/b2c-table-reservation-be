import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { WorkersService } from 'src/workers/workers.service';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';
import { CreateWorkerDto } from 'src/workers/dto/create-worker.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResponseAuthDto } from './dto/response-auth.dto';
import { AccountKind } from './enum/account-kind.enum';
import { JwtPayload } from './strategies/jwt/interface/user.request.interface';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private workersService: WorkersService,
    private jwtService: JwtService,
  ) {}

  private sign(payload: JwtPayload): ResponseAuthDto {
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(dto: RegisterDto): Promise<ResponseAuthDto> {
    await this.userService.create(dto);

    return this.login({
      email: dto.email,
      password: dto.password,
    });
  }

  async login(dto: LoginDto): Promise<ResponseAuthDto> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.sign({
      id: user.id,
      email: user.email,
      kind: AccountKind.USER,
    });
  }

  // Public business sign-up always creates an owner. Employees are created by
  // their owner, admins only through the seed script.
  async registerBusiness(dto: CreateWorkerDto): Promise<ResponseAuthDto> {
    await this.workersService.create(dto, WorkerRole.OWNER);

    return this.loginBusiness({
      email: dto.email,
      password: dto.password,
    });
  }

  async loginBusiness(dto: LoginDto): Promise<ResponseAuthDto> {
    const worker = await this.workersService.findByEmailWithPassword(dto.email);

    const isPasswordValid =
      worker !== null && (await bcrypt.compare(dto.password, worker.password));

    if (!worker || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.sign({
      id: worker.id,
      email: worker.email,
      kind: AccountKind.WORKER,
      role: worker.role,
      restaurantId: worker.restaurantId,
    });
  }

  async me(userId: number) {
    const user = await this.userService.findOneEntity(userId);

    return {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      phone_number: user.phone_number,
      email: user.email,
    };
  }

  async businessMe(workerId: number) {
    return this.workersService.findOne(workerId);
  }
}
