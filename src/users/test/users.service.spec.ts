import { UsersService } from '../users.service';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPaginationOptions } from 'src/common/utils/pagination.util';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthUser } from 'src/auth/strategies/jwt/interface/user.request.interface';
import { AccountKind } from 'src/auth/enum/account-kind.enum';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let usersService: UsersService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  const createUserDto: CreateUserDto = {
    name: 'John',
    lastname: 'Doe',
    phoneNumber: '1234567890',
    email: 'john@emaple.com',
    password: '12345',
  };

  const savedUser = {
    id: 1,
    name: createUserDto.name,
    lastname: createUserDto.lastname,
    phoneNumber: createUserDto.phoneNumber,
    email: createUserDto.email,
    password: 'hashed-password',
  } as User;

  beforeEach(async () => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should hash the password with 10 salt rounds', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.create!.mockReturnValue(savedUser);
      userRepository.save!.mockResolvedValue(savedUser);

      await usersService.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('should create a user with a hashed password', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.create!.mockReturnValue(savedUser);
      userRepository.save!.mockResolvedValue(savedUser);

      await usersService.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith({
        name: createUserDto.name,
        lastname: createUserDto.lastname,
        phoneNumber: createUserDto.phoneNumber,
        email: createUserDto.email,
        password: 'hashed-password',
      });
    });

    it('should save the created user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.create!.mockReturnValue(savedUser);
      userRepository.save!.mockResolvedValue(savedUser);

      await usersService.create(createUserDto);

      expect(userRepository.save).toHaveBeenCalledWith(savedUser);
    });

    it('should return the user response without the password', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.create!.mockReturnValue(savedUser);
      userRepository.save!.mockResolvedValue(savedUser);

      const result = await usersService.create(createUserDto);

      expect(result).toEqual({
        id: savedUser.id,
        name: savedUser.name,
        lastname: savedUser.lastname,
        phoneNumber: savedUser.phoneNumber,
        email: savedUser.email,
      });

      expect(result).not.toHaveProperty('password');
    });

    it('should throw an error if saving the user fails', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.create!.mockReturnValue(savedUser);
      userRepository.save!.mockRejectedValue(new Error('Database error'));

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      userRepository.findOne!.mockResolvedValue(savedUser);

      const result = await usersService.findByEmail('john@emaple.com');

      expect(result).toEqual(savedUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@emaple.com' },
      });
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(
        usersService.findByEmail('unknown@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include the email in the error message', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(
        usersService.findByEmail('unknown@example.com'),
      ).rejects.toThrow('User not found with email: unknown@example.com');
    });
  });

  describe('findAll', () => {
    const paginationQuery: PaginationQueryDto = {
      page: 1,
      limit: 10,
    };

    const secondUser = {
      id: 2,
      name: 'Test',
      lastname: 'Bob',
      phoneNumber: '1234567890',
      email: 'bob@emaple.com',
      password: 'another-hashed-password',
    };

    it('should return paginated users', async () => {
      userRepository.findAndCount!.mockResolvedValue([
        [savedUser, secondUser],
        2,
      ]);

      const result = await usersService.findAll(paginationQuery);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should call findAndCount with pagination options and id ascending order', async () => {
      userRepository.findAndCount!.mockResolvedValue([[savedUser], 1]);

      await usersService.findAll(paginationQuery);

      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        ...getPaginationOptions(paginationQuery),
        order: {
          id: 'ASC',
        },
      });
    });

    it('should map users to response DTOs without passwords', async () => {
      userRepository.findAndCount!.mockResolvedValue([[savedUser], 1]);

      const result = await usersService.findAll(paginationQuery);

      expect(result.data[0]).toEqual({
        id: savedUser.id,
        name: savedUser.name,
        lastname: savedUser.lastname,
        phoneNumber: savedUser.phoneNumber,
        email: savedUser.email,
      });

      expect(result.data[0]).not.toHaveProperty('password');
    });

    it('should return an empty page when no users exist', async () => {
      userRepository.findAndCount!.mockResolvedValue([[], 0]);

      const result = await usersService.findAll(paginationQuery);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a user by id without password', async () => {
      userRepository.findOne!.mockResolvedValue(savedUser);

      const result = await usersService.findOne(123);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 123 },
      });

      expect(result).toEqual({
        id: savedUser.id,
        name: savedUser.name,
        lastname: savedUser.lastname,
        phoneNumber: savedUser.phoneNumber,
        email: savedUser.email,
      });

      expect(result).not.toHaveProperty('password');
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(usersService.findOne(123)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('findByEntity', () => {
    it('should return the user entity by id', async () => {
      userRepository.findOne!.mockResolvedValue(savedUser);

      const result = await usersService.findOneEntity(123);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 123 },
      });

      expect(result).toEqual(savedUser);
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(usersService.findOneEntity(123)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('update', () => {
    const userId = 123;

    const updateDto: UpdateUserDto = {
      name: 'Updated John',
      lastname: 'Updated Doe',
    };

    const userActor: AuthUser = {
      kind: AccountKind.USER,
      userId,
    } as AuthUser;

    const adminActor: AuthUser = {
      kind: AccountKind.WORKER,
      role: WorkerRole.ADMIN,
    } as AuthUser;

    beforeEach(() => {
      userRepository.findOne!.mockResolvedValue(savedUser);
      userRepository.update!.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });
    });

    it('should allow a user to update their own profile', async () => {
      userRepository.findOne!.mockResolvedValue(savedUser);

      const result = await usersService.update(userId, updateDto, userActor);

      expect(userRepository.update).toHaveBeenCalledWith(userId, updateDto);

      expect(result).toEqual({
        id: savedUser.id,
        name: savedUser.name,
        lastname: savedUser.lastname,
        phoneNumber: savedUser.phoneNumber,
        email: savedUser.email,
      });
    });

    it('should allow an admin to update another user', async () => {
      await usersService.update(456, updateDto, adminActor);

      expect(userRepository.update).toHaveBeenCalledWith(456, updateDto);
    });

    it('should throw UserNotFoundException if user tries to update another profile', async () => {
      const anotherUserActor: AuthUser = {
        kind: AccountKind.USER,
        userId: 456,
      } as AuthUser;

      await expect(
        usersService.update(userId, updateDto, anotherUserActor),
      ).rejects.toThrow(UserNotFoundException);

      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundException if actor is not a USER or ADMIN', async () => {
      const workerActor: AuthUser = {
        kind: AccountKind.WORKER,
        role: WorkerRole.STAFF,
      } as AuthUser;

      await expect(
        usersService.update(userId, updateDto, workerActor),
      ).rejects.toThrow(UserNotFoundException);

      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should hash password before updating', async () => {
      const passwordDto: UpdateUserDto = {
        password: 'NewPassword123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await usersService.update(userId, passwordDto, userActor);

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 10);

      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        password: 'new-hashed-password',
      });
    });

    it('should not hash password if password not provided', async () => {
      await usersService.update(userId, updateDto, userActor);
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw userNotFoundException if use does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(
        usersService.update(userId, updateDto, userActor),
      ).rejects.toThrow(UserNotFoundException);

      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      userRepository.delete!.mockResolvedValue({
        affected: 1,
        raw: {},
      });

      const result = await usersService.remove(123);

      expect(userRepository.delete).toHaveBeenCalledWith(123);

      expect(result).toEqual({
        message: 'User removed successfully',
      });
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      userRepository.delete!.mockResolvedValue({
        affected: 0,
        raw: {},
      });

      await expect(usersService.remove(123)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(userRepository.delete).toHaveBeenCalledWith(123);
    });

    it('should throw UserNotFoundException if affected is null', async () => {
      userRepository.delete!.mockResolvedValue({
        affected: null,
        raw: {},
      });

      await expect(usersService.remove(123)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should propagate database errors', async () => {
      userRepository.delete!.mockRejectedValue(new Error('Database error'));

      await expect(usersService.remove(123)).rejects.toThrow('Database error');
    });
  });
});
