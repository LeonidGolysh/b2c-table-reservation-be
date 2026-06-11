import { NotFoundException } from '@nestjs/common';

export class RestaurantNorFoundException extends NotFoundException {
  constructor(id?: number) {
    super(id ? `Restaurant with ID ${id} not found` : 'Restaurant not found');
  }
}
