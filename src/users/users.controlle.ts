import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseUserDto } from './dto/response-user.dto';

@ApiTags('Users')
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
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password should be not empty'],
        error: 'Bad Request',
      },
    },
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
  @ApiResponse({
    status: 200,
    description: 'Users found',
    type: ResponseUserDto,
    isArray: true,
  })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    type: ResponseUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with ID 123 not found',
        error: 'Not Found',
      },
    },
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
    schema: {
      example: {
        statusCode: 404,
        message: 'User with ID 123 not found',
        error: 'Not Found',
      },
    },
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
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
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
    schema: {
      example: {
        statusCode: 404,
        message: 'User with ID 123 not found',
        error: 'Not Found',
      },
    },
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
