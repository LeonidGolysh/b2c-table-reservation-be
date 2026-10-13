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
import { UpdateReservationDto } from './dto/update-reservatio.dto';
import { ResponseReservationDto } from './dto/response-reservation.dto';
import { toResponseReservationDto } from './dto/mapper/response-reservation.mapper';
import { MailService } from 'src/mail/mail.service';
import { createHash, randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReservationsService {
  private readonly defaultDurationMinutes = 120;
  private readonly defaultBufferMinutes = 60;
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async getAll(restaurantId: number): Promise<ResponseReservationDto[]> {
    const reservations = await this.dataSource
      .getRepository(Reservation)
      .createQueryBuilder('reservation')
      .innerJoinAndSelect('reservation.restaurant', 'restaurant')
      .leftJoinAndSelect('reservation.reservationTables', 'reservationTables')
      .leftJoinAndSelect('reservationTables.restaurantTable', 'table')
      .where('restaurant.id = :restaurantId', { restaurantId })
      .orderBy('reservation.startTime', 'ASC')
      .getMany();

    return reservations.map(toResponseReservationDto);
  }

  async findById(
    restaurantId: number,
    reservationId: number,
  ): Promise<ResponseReservationDto> {
    const reservation = await this.dataSource
      .getRepository(Reservation)
      .createQueryBuilder('reservation')
      .innerJoin('reservation.restaurant', 'restaurant')
      .leftJoinAndSelect('reservation.reservationTables', 'reservationTables')
      .leftJoinAndSelect('reservationTables.restaurantTable', 'table')
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
  ): Promise<Reservation> {
    const startTime = this.validateStartTime(dto.startTime);
    const checkInToken = randomBytes(32).toString('hex');
    const checkInTokenHash = createHash('sha256')
      .update(checkInToken)
      .digest('hex');

    const reservation = await this.dataSource.transaction(async (manager) => {
      const restaurant = await this.findRestaurant(manager, restaurantId);

      const tables = await this.lockActiveTables(manager, restaurantId);

      const durationMinutes = this.defaultDurationMinutes;
      const bufferMinutes = this.defaultBufferMinutes;

      const requestedEnd = this.calculateOccupiedUntil(
        startTime,
        durationMinutes,
        bufferMinutes,
      );

      const busyTableIds = await this.findBusyTableIds(
        manager,
        tables,
        startTime,
        requestedEnd,
      );

      // Initially, only tables currently marked FREE are candidates
      // See the note below about future bookings and live table status.
      const availableTables = tables.filter(
        (table) =>
          table.status === RestaurantTableStatus.FREE &&
          !busyTableIds.has(table.id),
      );

      const selectedTables = this.selectTables(
        availableTables,
        dto.guestsCount,
      );

      if (!selectedTables) {
        throw new ConflictException(
          'No suitable combinations of tables is available for this time',
        );
      }

      const reservation = await this.saveReservation(
        manager,
        restaurant,
        dto,
        startTime,
        durationMinutes,
        bufferMinutes,
        checkInTokenHash,
      );

      await this.assignTables(manager, reservation, selectedTables);

      return this.findCreatedReservation(manager, reservation.id);
    });

    const checkInUrl =
      `${this.configService.getOrThrow<string>('FRONTEND_URL')}` +
      `/staff/check-in?token=${checkInToken}`;

    // Send the email only after the transaction has committed,
    // so table locks are not held during the SMTP call.
    try {
      await this.mailService.sendReservationDetailsEmail(
        {
          email: reservation.customerEmail,
          reservationId: reservation.id,
          restaurantName: reservation.restaurant.name,
          customerName: reservation.customerName,
          customerPhone: reservation.customerPhone ?? undefined,
          startTime: reservation.startTime.toISOString(),
          guestsCount: reservation.guestsCount,
        },
        checkInUrl,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send reservation email for reservation ${reservation.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return reservation;
  }

  async update(
    restaurantId: number,
    reservationId: number,
    dto: UpdateReservationDto,
  ): Promise<Reservation> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    return this.dataSource.transaction(async (manager) => {
      const reservationRepository = manager.getRepository(Reservation);

      const reservation = await reservationRepository
        .createQueryBuilder('reservation')
        .innerJoin('reservation.restaurant', 'restaurant')
        .where('reservation.id = :reservationId', {
          reservationId,
        })
        .andWhere('restaurant.id = :restaurantId', {
          restaurantId,
        })
        .setLock('pessimistic_write')
        .getOne();

      if (!reservation) {
        throw new NotFoundException('reservation not found');
      }

      if (
        reservation.status === ReservationStatus.CANCELED ||
        reservation.status === ReservationStatus.COMPLETED ||
        reservation.status === ReservationStatus.NO_SHOW
      ) {
        throw new ConflictException(
          'This reservation can no longer be updated.',
        );
      }

      const startTime = dto.startTime
        ? this.validateStartTime(dto.startTime)
        : reservation.startTime;

      const guestsCount = dto.guestsCount ?? reservation.guestsCount;
      const needsTableReassignment =
        dto.startTime !== undefined || dto.guestsCount !== undefined;

      if (needsTableReassignment) {
        const tables = await this.lockActiveTables(manager, restaurantId);
        const requestedEnd = this.calculateOccupiedUntil(
          startTime,
          reservation.durationMinutes,
          reservation.bufferMinutes,
        );

        const busyTableIds = await this.findBusyTableIds(
          manager,
          tables,
          startTime,
          requestedEnd,
          reservationId,
        );

        const availableTables = tables.filter(
          (table) =>
            table.status === RestaurantTableStatus.FREE &&
            !busyTableIds.has(table.id),
        );

        const selectedTables = this.selectTables(availableTables, guestsCount);

        if (!selectedTables) {
          throw new ConflictException(
            'No suitable combination of tables is available for this time',
          );
        }

        // Replace old table assignments only after finding a valid new combination.
        // The whole operation is transactional.
        await manager
          .getRepository(ReservationTable)
          .delete({ reservation: { id: reservationId } });

        await this.assignTables(manager, reservation, selectedTables);
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

      await reservationRepository.save(reservation);

      return this.findCreatedReservation(manager, reservation.id);
    });
  }

  async updateStatus(
    restaurantId: number,
    reservationId: number,
    status: ReservationStatus,
  ): Promise<ResponseReservationDto> {
    return this.dataSource.transaction(async (manager) => {
      const reservation = await manager
        .getRepository(Reservation)
        .createQueryBuilder('reservation')
        .innerJoinAndSelect('reservation.restaurant', 'restaurant')
        .where('reservation.id = :reservationId', { reservationId })
        .andWhere('restaurant.id = :restaurantId', { restaurantId })
        .setLock('pessimistic_write')
        .getOne();

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      const allowedTransitions: Record<ReservationStatus, ReservationStatus[]> =
        {
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

      if (!allowedTransitions[reservation.status].includes(status)) {
        throw new ConflictException(
          `Cannot change reservation status from "${reservation.status}" to "${status}"`,
        );
      }

      reservation.status = status;
      await manager.getRepository(Reservation).save(reservation);

      const updatedReservation = await manager
        .getRepository(Reservation)
        .createQueryBuilder('reservation')
        .innerJoinAndSelect('reservation.restaurant', 'restaurant')
        .leftJoinAndSelect('reservation.reservationTables', 'reservationTables')
        .leftJoinAndSelect('reservationTables.restaurantTable', 'table')
        .where('reservation.id = :reservationId', { reservationId })
        .getOneOrFail();

      return toResponseReservationDto(updatedReservation);
    });
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
        'No active table are available in this restaurant',
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
        statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
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
    // Prefer fewer tables and as little unused capacity as possible.
    const sorted = [...tables].sort((a, b) => a.seat - b.seat || a.id - b.id);

    let best: RestaurantTable[] | null = null;
    let bestSeats = Number.POSITIVE_INFINITY;

    // Search combinations, limiting search depth to avoid explosive
    // combinations in restaurants with many tables.
    const maxTables = Math.min(sorted.length, 8);

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

  private async saveReservation(
    manager: EntityManager,
    restaurant: Restaurant,
    dto: CreateReservationDto,
    startTime: Date,
    durationMinutes: number,
    bufferMinutes: number,
    checkInTokenHash: string,
  ): Promise<Reservation> {
    const repository = manager.getRepository(Reservation);

    const reservation = repository.create({
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      guestsCount: dto.guestsCount,
      startTime,
      durationMinutes,
      bufferMinutes,
      status: ReservationStatus.CONFIRMED,
      restaurant,
      checkInTokenHash,
    });

    return repository.save(reservation);
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

  private async findCreatedReservation(
    manager: EntityManager,
    reservationId: number,
  ): Promise<Reservation> {
    const reservation = await manager.getRepository(Reservation).findOne({
      where: {
        id: reservationId,
      },
      relations: {
        restaurant: true,
        reservationTables: {
          restaurantTable: true,
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Created reservation not found');
    }

    return reservation;
  }
}
