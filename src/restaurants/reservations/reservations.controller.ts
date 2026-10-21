import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ResponseReservationDto } from './dto/response-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { ApiPaginatedResponse } from 'src/common/decorator/api-paginated-response.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { AuthUser } from 'src/auth/strategies/jwt/interface/user.request.interface';

// Guests book without an account; everything else is for the restaurant's
// owner and employees.
@ApiTags('Reservations')
@Controller('restaurants/:restaurantId/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({ summary: 'Get all reservations for a restaurant' })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    description: 'Restaurant ID',
    example: 1,
  })
  @ApiPaginatedResponse(ResponseReservationDto)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkerRole.OWNER, WorkerRole.MANAGER, WorkerRole.STAFF)
  @ApiBearerAuth()
  @Get()
  async findAll(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PaginatedResponse<ResponseReservationDto>> {
    return this.reservationsService.getAll(restaurantId, query, user);
  }

  @ApiOperation({ summary: 'Get a reservation by ID' })
  @ApiParam({ name: 'restaurantId', type: Number })
  @ApiParam({ name: 'reservationId', type: Number })
  @ApiOkResponse({ type: ResponseReservationDto })
  @ApiNotFoundResponse({ description: 'Reservation not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkerRole.OWNER, WorkerRole.MANAGER, WorkerRole.STAFF)
  @ApiBearerAuth()
  @Get(':reservationId')
  async findById(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('reservationId', ParseIntPipe) reservationId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<ResponseReservationDto> {
    return this.reservationsService.findById(restaurantId, reservationId, user);
  }

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a reservation',
    description:
      'Creates a reservation and automatically assigns available tables.',
  })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    description: 'Restaurant ID',
    example: 1,
  })
  @ApiBody({ type: CreateReservationDto })
  @ApiCreatedResponse({
    type: ResponseReservationDto,
    description: 'Reservation created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid reservation data or start time',
  })
  @ApiNotFoundResponse({ description: 'Restaurant not found' })
  @ApiConflictResponse({ description: 'No suitable tables are available' })
  @Post()
  async create(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreateReservationDto,
  ): Promise<ResponseReservationDto> {
    return this.reservationsService.create(restaurantId, dto);
  }

  @ApiOperation({
    summary: 'Update a reservation',
    description:
      'Updates reservation details and reassigns tables if the time or guests count changes.',
  })
  @ApiParam({
    name: 'reservationId',
    type: Number,
    description: 'Reservation ID',
    example: 1,
  })
  @ApiBody({ type: UpdateReservationDto })
  @ApiOkResponse({
    type: ResponseReservationDto,
    description: 'Reservation updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid update data',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiNotFoundResponse({ description: 'Reservation not found' })
  @ApiConflictResponse({
    description: 'Reservation cannot be updated or tables are unavailable',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkerRole.OWNER, WorkerRole.MANAGER, WorkerRole.STAFF)
  @ApiBearerAuth()
  @Patch(':reservationId')
  async update(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('reservationId', ParseIntPipe) reservationId: number,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ResponseReservationDto> {
    return this.reservationsService.update(
      restaurantId,
      reservationId,
      dto,
      user,
    );
  }

  @ApiOperation({ summary: 'Update reservation status' })
  @ApiOkResponse({ type: ResponseReservationDto })
  @ApiNotFoundResponse({ description: 'Reservation not found' })
  @ApiConflictResponse({ description: 'Invalid status transition' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkerRole.OWNER, WorkerRole.MANAGER, WorkerRole.STAFF)
  @ApiBearerAuth()
  @Patch(':reservationId/status')
  async updateReservationStatus(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('reservationId', ParseIntPipe) reservationId: number,
    @Body() dto: UpdateReservationStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ResponseReservationDto> {
    return this.reservationsService.updateStatus(
      restaurantId,
      reservationId,
      dto.status,
      user,
    );
  }
}
