import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ResponseSubscriptionDto } from './dto/response-subscription.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionsService) {}

  @ApiOperation({ summary: 'Create subscription for restaurant' })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription successfully created',
    type: ResponseSubscriptionDto,
  })
  @ApiNotFoundResponse({
    description: 'Restaurant not found',
    type: ErrorResponseDto,
  })
  @Post(':restaurantId')
  create(
    @Param('restaurantId') restaurantId: number,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.create(restaurantId, dto.plan);
  }

  @ApiOperation({ summary: 'Activate subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription successfully activated',
    type: ResponseSubscriptionDto,
  })
  @ApiNotFoundResponse({
    description: 'Subscription not found',
    type: ErrorResponseDto,
  })
  @Put(':id/activate')
  activate(@Param('id') id: number) {
    return this.subscriptionService.activeSubscription(id);
  }

  @ApiOperation({ summary: 'Expire subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription successfully expired',
    type: ResponseSubscriptionDto,
  })
  @ApiNotFoundResponse({
    description: 'Subscription not found',
    type: ErrorResponseDto,
  })
  @Put(':id/expire')
  expire(@Param('id') id: number) {
    return this.subscriptionService.expireSubscription(id);
  }
}
