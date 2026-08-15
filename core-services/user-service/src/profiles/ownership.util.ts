import { NotFoundException } from '@nestjs/common';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

export function assertOwnershipOrAdmin(userId: string, requester: JwtUser): void {
  if (requester.userId !== userId && requester.role !== 'admin') {
    throw new NotFoundException('Recurso no encontrado');
  }
}
