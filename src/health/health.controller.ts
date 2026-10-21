import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

const CHECK_TIMEOUT_MS = 1500;

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @ApiOperation({ summary: 'Check database and Redis connectivity' })
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      this.db.pingCheck('database').withTimeout(CHECK_TIMEOUT_MS),
      this.redis.pingCheck('redis').withTimeout(CHECK_TIMEOUT_MS),
    ]);
  }
}
