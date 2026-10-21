import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseAuthDto } from './dto/response-auth.dto';
import { ValidationErrorResponse } from 'src/common/dto/validation-error-response.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CustomerGuard, WorkerGuard } from './guards/account-kind.guard';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';
import { CurrentUser } from './decorator/current-user.decorator';
import type { AuthUser } from './strategies/jwt/interface/user.request.interface';
import { CreateWorkerDto } from 'src/workers/dto/create-worker.dto';
import { ResponseWorkerDto } from 'src/workers/dto/response-worker.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: ResponseAuthDto,
  })
  @ApiBadRequestResponse({
    type: ValidationErrorResponse,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: ResponseAuthDto,
  })
  @ApiBadRequestResponse({
    type: ValidationErrorResponse,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
  })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Current user data',
    type: ResponseUserDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Token belongs to a business account',
    type: ErrorResponseDto,
  })
  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<ResponseUserDto> {
    return this.authService.me(user.userId);
  }

  @ApiOperation({
    summary: 'Register restaurant owner',
    description:
      'Creates a business account with the owner role. The owner is linked to restaurants when they create them.',
  })
  @ApiResponse({
    status: 201,
    description: 'Owner successfully registered',
    type: ResponseAuthDto,
  })
  @ApiBadRequestResponse({
    type: ValidationErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Worker with this email already exists',
    type: ErrorResponseDto,
  })
  @Post('business/register')
  registerBusiness(@Body() dto: CreateWorkerDto) {
    return this.authService.registerBusiness(dto);
  }

  @ApiOperation({ summary: 'Login business account (owner, employee, admin)' })
  @ApiResponse({
    status: 200,
    description: 'Worker successfully logged in',
    type: ResponseAuthDto,
  })
  @ApiBadRequestResponse({
    type: ValidationErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    type: ErrorResponseDto,
  })
  @Post('business/login')
  loginBusiness(@Body() dto: LoginDto) {
    return this.authService.loginBusiness(dto);
  }

  @UseGuards(JwtAuthGuard, WorkerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current business account' })
  @ApiResponse({
    status: 200,
    description: 'Current worker data',
    type: ResponseWorkerDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Token belongs to a customer account',
    type: ErrorResponseDto,
  })
  @Get('business/me')
  businessMe(@CurrentUser() user: AuthUser): Promise<ResponseWorkerDto> {
    return this.authService.businessMe(user.userId);
  }
}
