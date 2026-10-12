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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservatio.dto';
import { ResponseReservationDto } from './dto/response-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservatio-status.dto';

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
  @ApiOkResponse({ type: ResponseReservationDto, isArray: true })
  @Get()
  async findAll(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<ResponseReservationDto[]> {
    return this.reservationsService.getAll(restaurantId);
  }

  @ApiOperation({ summary: 'Get a reservation by ID' })
  @ApiParam({ name: 'restaurantId', type: Number })
  @ApiParam({ name: 'reservationId', type: Number })
  @ApiOkResponse({ type: ResponseReservationDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Reservation not found' })
  @Get(':reservationId')
  async findById(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('reservationId', ParseIntPipe) reservationId: number,
  ): Promise<ResponseReservationDto> {
    return this.reservationsService.findById(restaurantId, reservationId);
  }

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a reservation',
    description:
      'Create a reservation an automatically assigns available tables.',
  })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    description: 'Restaurant ID',
    example: 1,
  })
  @ApiBody({ type: CreateReservationDto })
  @ApiCreatedResponse({
    description: 'Reservation created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid reservation data or start time',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiNotFoundResponse({ description: 'Restaurant not found' })
  @ApiConflictResponse({ description: 'No suitable tables are available' })
  @Post()
  async create(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreateReservationDto,
  ) {
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
  @ApiCreatedResponse({
    description: 'Reservation updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid update data',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiNotFoundResponse({ description: 'Reservation not found' })
  @ApiConflictResponse({
    description: 'reservation cannot be updated or tables unavailable',
  })
  @Patch(':reservationId')
  async update(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('reservationId', ParseIntPipe) reservationId: number,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(restaurantId, reservationId, dto);
  }

  @ApiOperation({ summary: 'Update reservation status' })
  @ApiOkResponse({ type: ResponseReservationDto })
  @ApiNotFoundResponse({ description: 'Reservation not found' })
  @ApiConflictResponse({ description: 'Invalid status transition' })
  @Patch(':reservationId/status')
  async updateReservationStatus(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('reservationId', ParseIntPipe) reservationId: number,
    @Body() dto: UpdateReservationStatusDto,
  ): Promise<ResponseReservationDto> {
    return this.reservationsService.updateStatus(
      restaurantId,
      reservationId,
      dto.status,
    );
  }
}
