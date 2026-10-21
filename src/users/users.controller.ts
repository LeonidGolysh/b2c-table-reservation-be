import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseUserDto } from './dto/response-user.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import { ValidationErrorResponse } from 'src/common/dto/validation-error-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { ApiPaginatedResponse } from 'src/common/decorator/api-paginated-response.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { AuthUser } from 'src/auth/strategies/jwt/interface/user.request.interface';

@ApiTags('Users')
@ApiBearerAuth()
@ApiForbiddenResponse({
  description: 'Only admins can manage users',
  type: ErrorResponseDto,
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(WorkerRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: ResponseUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ValidationErrorResponse,
  })
  @ApiConflictResponse({
    description: 'User already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'User with email john@gmail.com already exists',
        error: 'Conflict',
      },
    },
  })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiPaginatedResponse(ResponseUserDto, 'Users found')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ResponseUserDto>> {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    type: ResponseUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @ApiOperation({ summary: 'Updated user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 200,
    type: ResponseUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'User already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'User with email john@gmail.com already exists',
        error: 'Conflict',
      },
    },
  })
  // Overrides the class-level admin-only rule; ownership is checked in the service.
  @Roles()
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(+id, dto, user);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        message: 'User deleted successfully',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
