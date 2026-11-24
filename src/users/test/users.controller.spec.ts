import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from '../dto/create-user.dto';
import { ResponseUserDto } from '../dto/response-user.dto';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthUser } from 'src/auth/strategies/jwt/interface/user.request.interface';
import { AccountKind } from 'src/auth/enum/account-kind.enum';
import { ConflictException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let userService: jest.Mocked<UsersService>;

  const createUserDto: CreateUserDto = {
    name: 'John',
    lastname: 'Doe',
    phoneNumber: '1234567890',
    email: 'johndoe@example.com',
    password: '12345',
  };

  const responseUser: ResponseUserDto = {
    id: 1,
    name: 'John',
    lastname: 'Doe',
    phoneNumber: '1234567890',
    email: 'johndoe@example.com',
  };

  const usersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call usersService.create with the provider DTO', async () => {
      usersServiceMock.create.mockResolvedValue(responseUser);

      await controller.create(createUserDto);

      expect(usersServiceMock.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should return the created user', async () => {
      usersServiceMock.create.mockResolvedValue(responseUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(responseUser);
    });

    it('should propagate service errors', async () => {
      usersServiceMock.create.mockRejectedValue(
        new Error('Something went wrong'),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        'Something went wrong',
      );
    });
  });

  describe('findAll', () => {
    const query: PaginationQueryDto = {
      page: 1,
      limit: 10,
    };

    const paginatedResponse = {
      data: [responseUser],
      total: 1,
      page: 1,
      limit: 10,
      totalPage: 1,
    };

    it('should call userService.findAll with query', async () => {
      usersServiceMock.findAll.mockResolvedValue(paginatedResponse);

      await controller.findAll(query);

      expect(usersServiceMock.findAll).toHaveBeenCalledWith(query);
    });

    it('should return paginated users', async () => {
      usersServiceMock.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(query);

      expect(result).toEqual(paginatedResponse);
    });

    it('should return an empty paginated response', async () => {
      const emptyResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      usersServiceMock.findAll.mockResolvedValue(emptyResponse);

      const result = await controller.findAll(query);

      expect(result).toEqual(emptyResponse);
      expect(result.data).toHaveLength(0);
    });

    it('should propagate service errors', async () => {
      usersServiceMock.findAll.mockRejectedValue(
        new Error('Something went wrong'),
      );

      await expect(controller.findAll(query)).rejects.toThrow(
        'Something went wrong',
      );
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOne with numeric id', async () => {
      usersServiceMock.findOne.mockResolvedValue(responseUser);

      await controller.findOne(123);

      expect(usersServiceMock.findOne).toHaveBeenCalledWith(123);
    });

    it('should return the user', async () => {
      usersServiceMock.findOne.mockResolvedValue(responseUser);

      const result = await controller.findOne(123);

      expect(result).toEqual(responseUser);
    });

    it('should throw an error if user is not found', async () => {
      usersServiceMock.findOne.mockRejectedValue(
        new UserNotFoundException(123),
      );

      await expect(controller.findOne(123)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should propagate service errors', async () => {
      usersServiceMock.findOne.mockRejectedValue(
        new Error('Something went wrong'),
      );

      await expect(controller.findOne(123)).rejects.toThrow(
        'Something went wrong',
      );
    });
  });

  describe('update', () => {
    const userId = 123;

    const updateUserDto: UpdateUserDto = {
      name: 'Updated John',
      lastname: 'Updated Doe',
    };

    const actor: AuthUser = {
      kind: AccountKind.USER,
      userId: 123,
    } as AuthUser;

    const updatedUser: ResponseUserDto = {
      ...responseUser,
      name: 'Updated John',
      lastname: 'Updated Doe',
    };

    it('should call userService.update with correct arguments', async () => {
      usersServiceMock.update.mockResolvedValue(updatedUser);

      await controller.update(userId, updateUserDto, actor);

      expect(usersServiceMock.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        actor,
      );
    });

    it('should return the updated user', async () => {
      usersServiceMock.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, updateUserDto, actor);

      expect(result).toEqual(updatedUser);
    });

    it('should propagate UserNotFoundExaption', async () => {
      usersServiceMock.update.mockRejectedValue(
        new UserNotFoundException(userId),
      );

      await expect(
        controller.update(userId, updateUserDto, actor),
      ).rejects.toThrow(UserNotFoundException);
    });

    it('should propagate ConflictException', async () => {
      usersServiceMock.update.mockRejectedValue(
        new ConflictException('User already exists'),
      );

      await expect(
        controller.update(userId, updateUserDto, actor),
      ).rejects.toThrow(ConflictException);
    });

    it('should propagate unexpected errors', async () => {
      usersServiceMock.update.mockRejectedValue(
        new Error('Something went wrong'),
      );

      await expect(
        controller.update(userId, updateUserDto, actor),
      ).rejects.toThrow('Something went wrong');
    });
  });

  describe('remove', () => {
    it('should call usersService.remove with corrent id', async () => {
      usersServiceMock.remove.mockResolvedValue({
        message: 'User removed successfully',
      });

      await controller.remove(123);

      expect(usersServiceMock.remove).toHaveBeenCalledWith(123);
    });

    it('should returtn success message', async () => {
      const response = {
        message: 'User removed successfully',
      };

      usersServiceMock.remove.mockResolvedValue(response);

      const result = await controller.remove(123);

      expect(result).toEqual(response);
    });

    it('should propagate UserNotFoundExaption', async () => {
      usersServiceMock.remove.mockRejectedValue(new UserNotFoundException(123));

      await expect(controller.remove(123)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should propagate unexpected errors', async () => {
      usersServiceMock.remove.mockRejectedValue(
        new Error('Something went wrong'),
      );

      await expect(controller.remove(123)).rejects.toThrow(
        'Something went wrong',
      );
    });
  });
});
