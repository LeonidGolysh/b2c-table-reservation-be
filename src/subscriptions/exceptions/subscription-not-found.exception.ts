import { NotFoundException } from '@nestjs/common';

export class SubscriptionNotFoundException extends NotFoundException {
  constructor(id?: number) {
    super(
      id ? `Subscription with ID ${id} not found` : 'Subscription not found',
    );
  }
}
