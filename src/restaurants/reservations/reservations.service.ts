import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Reservation } from './entity/reservation.entity';
import { DataSource, EntityManager } from 'typeorm';
import { Restaurant } from '../entity/restaurant.entity';
import { RestaurantTable } from '../tables/entity/restaurant-table.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationTable } from './entity/reservation-table.entity';
import { ReservationStatus } from './enum/reservation-status.enum';
import { RestaurantTableStatus } from '../tables/enum/restaurant-table-status.enum';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ResponseReservationDto } from './dto/response-reservation.dto';
import { toResponseReservationDto } from './dto/mapper/response-reservation.mapper';
import { MailService } from 'src/mail/mail.service';
import { createHash, randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  getPaginationOptions,
  toPaginatedResponse,
} from 'src/common/utils/pagination.util';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';

const DEFAULT_DURATION_MINUTES = 120;
const DEFAULT_BUFFER_MINUTES = 60;

// Upper bound on how many tables can be combined for one reservation.
// Keeps the combination search from exploding in large restaurants.
const MAX_TABLES_PER_RESERVATION = 8;

// Reservations in these statuses hold their tables.
const ACTIVE_STATUSES = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
];

const ALLOWED_STATUS_TRANSITIONS: Record<
  ReservationStatus,
  ReservationStatus[]
> = {
  [ReservationStatus.PENDING]: [
    ReservationStatus.CONFIRMED,
    ReservationStatus.CANCELED,
    ReservationStatus.NO_SHOW,
  ],
  [ReservationStatus.CONFIRMED]: [
    ReservationStatus.CANCELED,
    ReservationStatus.COMPLETED,
    ReservationStatus.NO_SHOW,
  ],
  [ReservationStatus.CANCELED]: [],
  [ReservationStatus.COMPLETED]: [],
  [ReservationStatus.NO_SHOW]: [],
};

interface TableRequest {
  restaurantId: number;
  startTime: Date;
  guestsCount: number;
  durationMinutes: number;
  bufferMinutes: number;
  excludeReservationId?: number;
}

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async getAll(
    restaurantId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ResponseReservationDto>> {
    const { skip, take } = getPaginationOptions(query);

    // skip/take (not offset/limit) so TypeORM paginates by reservation,
    // not by joined table rows.
    const [reservations, total] = await this.reservationQuery(
      this.dataSource.manager,
    )
      .where('restaurant.id = :restaurantId', { restaurantId })
      .orderBy('reservation.startTime', 'ASC')
      .addOrderBy('reservation.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return toPaginatedResponse(
      reservations.map(toResponseReservationDto),
      total,
      query,
    );
  }

  async findById(
    restaurantId: number,
    reservationId: number,
  ): Promise<ResponseReservationDto> {
    const reservation = await this.reservationQuery(this.dataSource.manager)
      .where('restaurant.id = :restaurantId', { restaurantId })
      .andWhere('reservation.id = :reservationId', { reservationId })
      .getOne();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return toResponseReservationDto(reservation);
  }

  async create(
    restaurantId: number,
    dto: CreateReservationDto,
  ): Promise<ResponseReservationDto> {
    const startTime = this.validateStartTime(dto.startTime);
    const { token: checkInToken, hash: checkInTokenHash } =
      this.generateCheckInToken();

    const reservation = await this.dataSource.transaction(async (manager) => {
      const restaurant = await this.findRestaurant(manager, restaurantId);

      const tables = await this.allocateTables(manager, {
        restaurantId,
        startTime,
        guestsCount: dto.guestsCount,
        durationMinutes: DEFAULT_DURATION_MINUTES,
        bufferMinutes: DEFAULT_BUFFER_MINUTES,
      });

      const reservationRepository = manager.getRepository(Reservation);
      const reservation = await reservationRepository.save(
        reservationRepository.create({
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          guestsCount: dto.guestsCount,
          startTime,
          durationMinutes: DEFAULT_DURATION_MINUTES,
          bufferMinutes: DEFAULT_BUFFER_MINUTES,
          status: ReservationStatus.CONFIRMED,
          restaurant,
          checkInTokenHash,
        }),
      );

      await this.assignTables(manager, reservation, tables);

      return this.findReservationWithRelations(manager, reservation.id);
    });

    // Send the email only after the transaction has committed,
    // so table locks are not held during the SMTP call.
    await this.sendReservationEmail(reservation, checkInToken);

    return toResponseReservationDto(reservation);
  }

  async update(
    restaurantId: number,
    reservationId: number,
    dto: UpdateReservationDto,
  ): Promise<ResponseReservationDto> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    const reservation = await this.dataSource.transaction(async (manager) => {
      const reservation = await this.lockReservation(
        manager,
        restaurantId,
        reservationId,
      );

      if (this.isFinalStatus(reservation.status)) {
        throw new ConflictException(
          'This reservation can no longer be updated',
        );
      }

      const startTime = dto.startTime
        ? this.validateStartTime(dto.startTime)
        : reservation.startTime;
      const guestsCount = dto.guestsCount ?? reservation.guestsCount;

      if (dto.startTime !== undefined || dto.guestsCount !== undefined) {
        const tables = await this.allocateTables(manager, {
          restaurantId,
          startTime,
          guestsCount,
          durationMinutes: reservation.durationMinutes,
          bufferMinutes: reservation.bufferMinutes,
          excludeReservationId: reservationId,
        });

        // Replace old table assignments only after finding a valid new combination.
        // The whole operation is transactional.
        await manager
          .getRepository(ReservationTable)
          .delete({ reservation: { id: reservationId } });

        await this.assignTables(manager, reservation, tables);
      }

      if (dto.customerName !== undefined) {
        reservation.customerName = dto.customerName;
      }

      if (dto.customerEmail !== undefined) {
        reservation.customerEmail = dto.customerEmail;
      }

      if (dto.customerPhone !== undefined) {
        reservation.customerPhone = dto.customerPhone;
      }

      reservation.guestsCount = guestsCount;
      reservation.startTime = startTime;

      await manager.getRepository(Reservation).save(reservation);

      return this.findReservationWithRelations(manager, reservation.id);
    });

    return toResponseReservationDto(reservation);
  }

  async updateStatus(
    restaurantId: number,
    reservationId: number,
    status: ReservationStatus,
  ): Promise<ResponseReservationDto> {
    const reservation = await this.dataSource.transaction(async (manager) => {
      const reservation = await this.lockReservation(
        manager,
        restaurantId,
        reservationId,
      );

      if (!ALLOWED_STATUS_TRANSITIONS[reservation.status].includes(status)) {
        throw new ConflictException(
          `Cannot change reservation status from "${reservation.status}" to "${status}"`,
        );
      }

      reservation.status = status;
      await manager.getRepository(Reservation).save(reservation);

      return this.findReservationWithRelations(manager, reservation.id);
    });

    return toResponseReservationDto(reservation);
  }

  private reservationQuery(manager: EntityManager) {
    return manager
      .getRepository(Reservation)
      .createQueryBuilder('reservation')
      .innerJoinAndSelect('reservation.restaurant', 'restaurant')
      .leftJoinAndSelect('reservation.reservationTables', 'reservationTables')
      .leftJoinAndSelect('reservationTables.restaurantTable', 'table');
  }

  private async findReservationWithRelations(
    manager: EntityManager,
    reservationId: number,
  ): Promise<Reservation> {
    return this.reservationQuery(manager)
      .where('reservation.id = :reservationId', { reservationId })
      .getOneOrFail();
  }

  private async lockReservation(
    manager: EntityManager,
    restaurantId: number,
    reservationId: number,
  ): Promise<Reservation> {
    const reservation = await manager
      .getRepository(Reservation)
      .createQueryBuilder('reservation')
      .innerJoin('reservation.restaurant', 'restaurant')
      .where('reservation.id = :reservationId', { reservationId })
      .andWhere('restaurant.id = :restaurantId', { restaurantId })
      .setLock('pessimistic_write')
      .getOne();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  private isFinalStatus(status: ReservationStatus): boolean {
    return ALLOWED_STATUS_TRANSITIONS[status].length === 0;
  }

  private generateCheckInToken(): { token: string; hash: string } {
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');

    return { token, hash };
  }

  private async sendReservationEmail(
    reservation: Reservation,
    checkInToken: string,
  ): Promise<void> {
    const checkInUrl =
      `${this.configService.getOrThrow<string>('FRONTEND_URL')}` +
      `/staff/check-in?token=${checkInToken}`;

    // The reservation is already committed, so an email failure
    // must not fail the request.
    try {
      await this.mailService.sendReservationDetailsEmail({
        email: reservation.customerEmail,
        reservationId: reservation.id,
        restaurantName: reservation.restaurant.name,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone ?? undefined,
        startTime: reservation.startTime,
        guestsCount: reservation.guestsCount,
        checkInUrl,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reservation email for reservation ${reservation.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private validateStartTime(value: string): Date {
    const startTime = new Date(value);

    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid reservation start time');
    }

    if (startTime.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Reservation start time should be in the future',
      );
    }

    return startTime;
  }

  private async findRestaurant(
    manager: EntityManager,
    restaurantId: number,
  ): Promise<Restaurant> {
    const restaurant = await manager
      .getRepository(Restaurant)
      .findOne({ where: { id: restaurantId } });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  // Locks the restaurant's tables and picks a free combination that fits
  // the guests for the requested time slot. Throws if none fits.
  private async allocateTables(
    manager: EntityManager,
    request: TableRequest,
  ): Promise<RestaurantTable[]> {
    const tables = await this.lockActiveTables(manager, request.restaurantId);

    const occupiedUntil = this.calculateOccupiedUntil(
      request.startTime,
      request.durationMinutes,
      request.bufferMinutes,
    );

    const busyTableIds = await this.findBusyTableIds(
      manager,
      tables,
      request.startTime,
      occupiedUntil,
      request.excludeReservationId,
    );

    // Initially, only tables currently marked FREE are candidates.
    const availableTables = tables.filter(
      (table) =>
        table.status === RestaurantTableStatus.FREE &&
        !busyTableIds.has(table.id),
    );

    const selectedTables = this.selectTables(
      availableTables,
      request.guestsCount,
    );

    if (!selectedTables) {
      throw new ConflictException(
        'No suitable combination of tables is available for this time',
      );
    }

    return selectedTables;
  }

  private async lockActiveTables(
    manager: EntityManager,
    restaurantId: number,
  ): Promise<RestaurantTable[]> {
    // Lock active tables in a consistent order.
    // This serializes table allocation for this restaurant.
    const tables = await manager
      .getRepository(RestaurantTable)
      .createQueryBuilder('table')
      .innerJoin('table.restaurant', 'restaurant')
      .where('restaurant.id = :restaurantId', { restaurantId })
      .andWhere('table.isActive = :isActive', { isActive: true })
      .orderBy('table.id', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

    if (tables.length === 0) {
      throw new ConflictException(
        'No active tables are available in this restaurant',
      );
    }

    return tables;
  }

  private calculateOccupiedUntil(
    startTime: Date,
    durationMinutes: number,
    bufferMinutes: number,
  ): Date {
    const totalMinutes = durationMinutes + bufferMinutes;

    return new Date(startTime.getTime() + totalMinutes * 60_000);
  }

  private async findBusyTableIds(
    manager: EntityManager,
    tables: RestaurantTable[],
    requestedStart: Date,
    requestedEnd: Date,
    excludeReservationId?: number,
  ): Promise<Set<number>> {
    const tableIds = tables.map((table) => table.id);

    // Find reservations whose planned occupied intervals overlap.
    const query = manager
      .getRepository(ReservationTable)
      .createQueryBuilder('rt')
      .innerJoin('rt.reservation', 'reservation')
      .innerJoin('rt.restaurantTable', 'table')
      .select('table.id', 'tableId')
      .where('table.id IN (:...tableIds)', { tableIds })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: ACTIVE_STATUSES,
      })
      .andWhere('reservation.startTime < :requestedEnd', {
        requestedEnd,
      })
      .andWhere(
        `reservation.startTime + ((reservation.durationMinutes + reservation.bufferMinutes)
          * INTERVAL '1 minute') > :requestedStart`,
        { requestedStart },
      );

    if (excludeReservationId !== undefined) {
      query.andWhere('reservation.id != :excludeReservationId', {
        excludeReservationId,
      });
    }

    const conflicts = await query.getRawMany<{ tableId: number | string }>();

    return new Set(conflicts.map(({ tableId }) => Number(tableId)));
  }

  private selectTables(
    tables: RestaurantTable[],
    guestsCount: number,
  ): RestaurantTable[] | null {
    // Prefer as little unused capacity as possible, then fewer tables.
    const sorted = [...tables].sort((a, b) => a.seat - b.seat || a.id - b.id);

    let best: RestaurantTable[] | null = null;
    let bestSeats = Number.POSITIVE_INFINITY;

    const maxTables = Math.min(sorted.length, MAX_TABLES_PER_RESERVATION);

    const search = (
      start: number,
      chosen: RestaurantTable[],
      seats: number,
    ) => {
      if (seats >= guestsCount) {
        if (
          !best ||
          seats < bestSeats ||
          (seats === bestSeats && chosen.length < best.length)
        ) {
          best = [...chosen];
          bestSeats = seats;
        }
        return;
      }

      if (chosen.length >= maxTables || seats >= bestSeats) {
        return;
      }

      for (let i = start; i < sorted.length; i++) {
        search(i + 1, [...chosen, sorted[i]], seats + sorted[i].seat);
      }
    };

    search(0, [], 0);
    return best;
  }

  private async assignTables(
    manager: EntityManager,
    reservation: Reservation,
    tables: RestaurantTable[],
  ): Promise<void> {
    const repository = manager.getRepository(ReservationTable);

    const assignments = tables.map((restaurantTable) =>
      repository.create({
        reservation,
        restaurantTable,
      }),
    );

    await repository.save(assignments);
  }
}
