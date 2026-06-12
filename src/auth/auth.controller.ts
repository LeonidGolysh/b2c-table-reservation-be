import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ResponseAuthDto } from './dto/response-auth.dto';
import { ValidationErrorResponse } from 'src/common/dto/validation-error-response.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';

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
}
