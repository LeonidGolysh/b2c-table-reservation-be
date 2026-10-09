import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { AuthModule } from './auth/auth.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { StripeModule } from './stripe/stripe.module';
import { PaymentModule } from './payments/payments.module';
import { RedisModule } from './redis/redis.module';
import { BillingsModule } from './billings/billings.module';
import { MailModule } from './mail/mail.module';
import { RestaurantTablesModule } from './restaurants/tables/restaurant-tables.module';

@Module({
  imports: [
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    RestaurantsModule,
    ReviewsModule,
    SubscriptionsModule,
    StripeModule,
    PaymentModule,
    BillingsModule,
    MailModule,
    RestaurantTablesModule,
  ],
})
export class AppModule {}
