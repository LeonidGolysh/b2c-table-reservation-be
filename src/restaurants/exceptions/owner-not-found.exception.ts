import { NotFoundException } from '@nestjs/common';

export class OwnerNotFoundException extends NotFoundException {
  constructor(id?: number) {
    super(id ? `Owner with ID ${id} not found` : 'Owner not found');
  }
}
