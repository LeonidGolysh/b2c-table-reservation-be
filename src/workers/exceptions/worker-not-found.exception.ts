import { NotFoundException } from '@nestjs/common';

export class WorkerNotFoundException extends NotFoundException {
  constructor(id?: number) {
    super(id ? `Worker with ID ${id} not found` : 'Worker not found');
  }
}
