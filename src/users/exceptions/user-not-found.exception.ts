import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(id?: number) {
    super(id ? `User with ID ${id} not found` : 'User not found');
  }
}
