import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { AuthModule } from './auth/auth.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { StripeModule } from './stripe/stripe.module';
import { PaymentsModule } from './payments/payments.module';
import { RedisModule } from './redis/redis.module';
import { BillingsModule } from './billings/billings.module';
import { MailModule } from './mail/mail.module';
import { RestaurantTablesModule } from './restaurants/tables/restaurant-tables.module';
import { ReservationsModule } from './restaurants/reservations/reservations.module';
import { WorkersModule } from './workers/workers.module';
import { EmployeesModule } from './restaurants/employees/employees.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        // JSON logs in production, readable ones locally.
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        autoLogging: {
          ignore: (req) => req.url === '/health',
        },
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    WorkersModule,
    RestaurantsModule,
    ReviewsModule,
    SubscriptionsModule,
    StripeModule,
    PaymentsModule,
    BillingsModule,
    MailModule,
    RestaurantTablesModule,
    ReservationsModule,
    EmployeesModule,
    HealthModule,
  ],
})
export class AppModule {}
