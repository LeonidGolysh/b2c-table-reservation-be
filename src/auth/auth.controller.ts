import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseAuthDto } from './dto/response-auth.dto';
import { ValidationErrorResponse } from 'src/common/dto/validation-error-response.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ResponseCurrentUserDto } from './dto/response-current-user.dto';
import { CurrentUser } from './decorator/current-user.decorator';

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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Current user data',
    type: ResponseCurrentUserDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @Get('me')
  me(@CurrentUser() user: any): Promise<ResponseCurrentUserDto> {
    return this.authService.me(user.userId);
  }
}
