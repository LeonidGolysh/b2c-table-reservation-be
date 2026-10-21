import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'http';
import { QueryFailedError } from 'typeorm';

// Postgres error code for a unique constraint violation.
const PG_UNIQUE_VIOLATION = '23505';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Sends every error in the same shape as ErrorResponseDto, maps unique
// constraint violations to 409 and hides internal errors behind a generic 500.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    // Bodies with their own structure (e.g. the health check's per-service
    // report) are sent unchanged.
    if (exception instanceof HttpException && this.isCustomBody(exception)) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const body = this.toErrorBody(exception);

    if (body.statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return { statusCode, message: res, error: this.errorName(statusCode) };
      }

      const { message, error } = res as Partial<ErrorBody>;

      return {
        statusCode,
        message: message ?? exception.message,
        error: error ?? this.errorName(statusCode),
      };
    }

    if (this.isUniqueViolation(exception)) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Resource already exists',
        error: this.errorName(HttpStatus.CONFLICT),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: this.errorName(HttpStatus.INTERNAL_SERVER_ERROR),
    };
  }

  private isCustomBody(exception: HttpException): boolean {
    const res = exception.getResponse();

    return typeof res === 'object' && res !== null && !('message' in res);
  }

  private isUniqueViolation(exception: unknown): boolean {
    if (!(exception instanceof QueryFailedError)) {
      return false;
    }

    const driverError = exception.driverError as { code?: string } | undefined;

    return driverError?.code === PG_UNIQUE_VIOLATION;
  }

  private errorName(statusCode: number): string {
    return STATUS_CODES[statusCode] ?? 'Error';
  }
}
