import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { RestaurantsService } from './restaurants.service';
import { ResponseRestaurantDto } from './dto/response-restaurant.dto';
import { ValidationErrorResponse } from 'src/common/dto/validation-error-response.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { AuthUser } from 'src/auth/strategies/jwt/interface/user.request.interface';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { ApiPaginatedResponse } from 'src/common/decorator/api-paginated-response.decorator';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @ApiOperation({ summary: 'Create restaurant' })
  @ApiResponse({
    status: 201,
    description: 'Restaurant successfully created',
    type: ResponseRestaurantDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ValidationErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Restaurant already exists',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only owners can create restaurants',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkerRole.OWNER)
  @ApiBearerAuth()
  @Post()
  create(
    @Body() dto: CreateRestaurantDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ResponseRestaurantDto> {
    return this.restaurantsService.create(user.userId, dto);
  }

  @ApiOperation({ summary: 'Get all restaurants' })
  @ApiPaginatedResponse(
    ResponseRestaurantDto,
    'Restaurants retrieved successfully',
  )
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ResponseRestaurantDto>> {
    return this.restaurantsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get restaurant by id' })
  @ApiResponse({
    status: 200,
    description: 'Restaurants retrieved successfully',
    type: ResponseRestaurantDto,
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found',
    type: ErrorResponseDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ResponseRestaurantDto> {
    return this.restaurantsService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update restaurant' })
  @ApiBody({ type: CreateRestaurantDto })
  @ApiResponse({
    status: 200,
    description: 'Restaurant updated successfully',
    type: ResponseRestaurantDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkerRole.OWNER, WorkerRole.ADMIN)
  @ApiBearerAuth()
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ResponseRestaurantDto> {
    return this.restaurantsService.update(+id, dto, user);
  }

  @ApiOperation({ summary: 'Delete restaurant' })
  @ApiResponse({
    status: 200,
    description: 'Restaurant deleted successfully',
    schema: {
      example: {
        message: 'Restaurant deleted successfully',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkerRole.OWNER, WorkerRole.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    return this.restaurantsService.remove(+id, user);
  }
}
