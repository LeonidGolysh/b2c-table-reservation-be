import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RestaurantTablesService } from './restaurant-tables.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/auth/strategies/jwt/user.request.interface';
import { CreateRestaurantTableDto } from './dto/create-restaurant-table.dto';
import { UpdateRestaurantTableDto } from './dto/update-restaurant-table.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Restaurants table')
@Controller('restaurants/:restaurantId/tables')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RestaurantTablesController {
  constructor(
    private readonly restaurantTablesService: RestaurantTablesService,
  ) {}

  @ApiOperation({
    summary: 'Get all tables of a restaurant',
    description:
      'Returns all tables belonging to a restaurant owned by the authenticated user',
  })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    description: 'ID of the restaurant',
    example: 1,
  })
  @ApiOkResponse({
    description: 'List of restaurant tables returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid restaurant ID or request body.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing or invalid.',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found or does not belong to the current user.',
  })
  @Get()
  async findAll(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.restaurantTablesService.findAll(restaurantId, req.user.userId);
  }

  @ApiOperation({
    summary: 'Get a restaurant table',
    description: 'Returns a specific table from the specified restaurant.',
  })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    description: 'ID of the restaurant',
    example: 1,
  })
  @ApiParam({
    name: 'tableId',
    type: Number,
    description: 'ID of the table',
    example: 3,
  })
  @ApiOkResponse({ description: 'Restaurant table returned successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid restaurant or table ID.' })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing or invalid.',
  })
  @ApiNotFoundResponse({ description: 'Restaurant or table not found.' })
  @Get(':tableId')
  async findOne(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.restaurantTablesService.findOne(
      restaurantId,
      tableId,
      req.user.userId,
    );
  }

  @ApiOperation({
    summary: 'Create table',
    description:
      'Create a table in a restaurant owned by the authenticated user',
  })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    description: 'ID of the restaurant',
    example: 1,
  })
  @ApiBody({
    type: CreateRestaurantTableDto,
  })
  @ApiCreatedResponse({
    description: 'Restaurant table created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid restaurant ID or request body.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing or invalid.',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found or does not belong to the current user.',
  })
  @ApiConflictResponse({
    description: 'A table with this number already exists in this restaurant.',
  })
  @Post()
  async create(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreateRestaurantTableDto,
    @Req() req: RequestWithUser,
  ) {
    return this.restaurantTablesService.create(
      restaurantId,
      req.user.userId,
      dto,
    );
  }

  @ApiOperation({
    summary: 'Update a restaurant table',
    description:
      'Updates the table number, seating capacity, or active status. All fields are optional.',
  })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    description: 'ID of the restaurant',
    example: 1,
  })
  @ApiParam({
    name: 'tableId',
    type: Number,
    description: 'ID of the table',
    example: 3,
  })
  @ApiBody({ type: UpdateRestaurantTableDto })
  @ApiOkResponse({ description: 'Restaurant table updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid IDs or request body.' })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing or invalid.',
  })
  @ApiNotFoundResponse({ description: 'Restaurant or table not found.' })
  @ApiConflictResponse({
    description: 'A table with the requested number already exists.',
  })
  @Put(':tableId')
  async update(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Body() dto: UpdateRestaurantTableDto,
    @Req() req: RequestWithUser,
  ) {
    return this.restaurantTablesService.update(
      restaurantId,
      tableId,
      req.user.userId,
      dto,
    );
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a restaurant table',
    description: 'Permanently deletes a table from the specified restaurant.',
  })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    description: 'ID of the restaurant',
    example: 1,
  })
  @ApiParam({
    name: 'tableId',
    type: Number,
    description: 'ID of the table',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Restaurant table deleted successfully.',
    schema: { example: { message: 'Table deleted successfully' } },
  })
  @ApiBadRequestResponse({ description: 'Invalid restaurant or table ID.' })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing or invalid.',
  })
  @ApiNotFoundResponse({ description: 'Restaurant or table not found.' })
  @Delete(':tableId')
  async remove(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.restaurantTablesService.remove(
      restaurantId,
      tableId,
      req.user.userId,
    );
  }
}
