import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator implements OnModuleDestroy {
  // Separate from the BullMQ connection so a health check never blocks a queue.
  private readonly client = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  pingCheck<Key extends string>(key: Key) {
    return this.healthIndicatorService.check(key).attempt(async () => {
      await this.client.ping();
    });
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }
}
