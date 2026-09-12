import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BillingsService } from './billings.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { RequestWithUser } from 'src/auth/strategies/jwt/user.request.interface';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BillingRestaurantResponseDto } from './dto/billing-restaurant-response.dto';
import { CurrentBillingResponseDto } from './dto/current-billing-response.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@ApiTags('Billings')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingsController {
  constructor(private readonly billingsService: BillingsService) {}

  @ApiOperation({
    summary: 'Get all restaurants billing information',
    description:
      'Returns all restaurants belonging to the authenticated owner with their current subscription information.',
  })
  @ApiOkResponse({
    description: 'Billing information for all owner restaurants',
    type: BillingRestaurantResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'JWT token is missing, invalid, or user ID is unavailable',
  })
  @Get('restaurants')
  getRestaurants(@Req() req: RequestWithUser) {
    return this.billingsService.getRestaurantsByOwner(req.user.userId);
  }

  @ApiOperation({
    summary: 'Get current billing for a restaurant',
    description:
      'Returns current subscription and billing status of a restaurant belonging to the authenticated owner.',
  })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    example: 1,
    description: 'Restaurant ID',
  })
  @ApiOkResponse({
    description: 'Current restaurant billing information',
    type: CurrentBillingResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'JWT token is missing or invalid',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant or subscription was not found',
  })
  @Get('restaurants/:restaurantId/current')
  getCurrentBilling(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.billingsService.getCurrentBilling(
      restaurantId,
      req.user.userId,
    );
  }

  @ApiOperation({
    summary: 'Get restaurant payment history',
    description:
      'Returns payment history for a restaurant belonging to the authenticated owner.',
  })
  @ApiParam({
    name: 'restaurantId',
    type: Number,
    example: 1,
    description: 'Restaurant ID',
  })
  @ApiOkResponse({
    description: 'Restaurant payment history',
    type: PaymentResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'JWT token not found',
  })
  @ApiNotFoundResponse({
    description:
      'Restaurant was not found or does not belong to the authenticated owner',
  })
  @Get('restaurants/:restaurantId/payments')
  getPaymentHistory(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.billingsService.getPaymentHistory(
      restaurantId,
      req.user.userId,
    );
  }
}
