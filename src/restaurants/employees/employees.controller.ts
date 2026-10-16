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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { AuthUser } from 'src/auth/strategies/jwt/interface/user.request.interface';
import { WorkerRole } from 'src/workers/enum/worker-role.enum';
import { ResponseWorkerDto } from 'src/workers/dto/response-worker.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { ApiPaginatedResponse } from 'src/common/decorator/api-paginated-response.decorator';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import { ValidationErrorResponse } from 'src/common/dto/validation-error-response.dto';

@ApiTags('Restaurant employees')
@Controller('restaurants/:restaurantId/employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(WorkerRole.OWNER)
@ApiBearerAuth()
@ApiParam({
  name: 'restaurantId',
  type: Number,
  description: 'ID of the restaurant',
  example: 1,
})
@ApiUnauthorizedResponse({
  description: 'Authentication token is missing or invalid.',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'Only owners can manage employees.',
  type: ErrorResponseDto,
})
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiOperation({
    summary: 'Create employee',
    description:
      'Creates a manager or staff account for a restaurant owned by the authenticated owner.',
  })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiCreatedResponse({
    description: 'Employee created successfully.',
    type: ResponseWorkerDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description:
      'Restaurant not found or does not belong to the current owner.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Worker with this email already exists.',
    type: ErrorResponseDto,
  })
  @Post()
  create(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ResponseWorkerDto> {
    return this.employeesService.create(restaurantId, user.userId, dto);
  }

  @ApiOperation({ summary: 'Get all employees of a restaurant' })
  @ApiPaginatedResponse(ResponseWorkerDto, 'Employees found')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiNotFoundResponse({
    description:
      'Restaurant not found or does not belong to the current owner.',
    type: ErrorResponseDto,
  })
  @Get()
  findAll(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PaginatedResponse<ResponseWorkerDto>> {
    return this.employeesService.findAll(restaurantId, user.userId, query);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove employee' })
  @ApiParam({
    name: 'employeeId',
    type: Number,
    description: 'ID of the employee',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Employee removed successfully.',
    schema: { example: { message: 'Employee removed successfully' } },
  })
  @ApiNotFoundResponse({
    description: 'Restaurant or employee not found.',
    type: ErrorResponseDto,
  })
  @Delete(':employeeId')
  remove(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    return this.employeesService.remove(restaurantId, employeeId, user.userId);
  }
}
