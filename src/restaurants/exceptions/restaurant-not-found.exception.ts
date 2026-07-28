import { NotFoundException } from '@nestjs/common';

export class RestaurantNotFoundException extends NotFoundException {
  constructor(id?: number) {
    super(id ? `Restaurant with ID ${id} not found` : 'Restaurant not found');
  }
}
