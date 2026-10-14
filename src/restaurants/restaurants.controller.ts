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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateRestaurantDto): Promise<ResponseRestaurantDto> {
    return this.restaurantsService.create(dto);
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
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ): Promise<ResponseRestaurantDto> {
    return this.restaurantsService.update(+id, dto);
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
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.restaurantsService.remove(+id);
  }
}
