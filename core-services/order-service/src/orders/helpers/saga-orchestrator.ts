import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '../enums/order-status.enum';
import { isValidTransition, canCancel } from './status-machine';

export interface CompensationActions {
  releaseStock: boolean;
  cancelPayment: boolean;
  deleteOrder: boolean;
}

@Injectable()
export class SagaOrchestrator {
  private readonly logger = new Logger(SagaOrchestrator.name);

  determineCompensation(failedStep: 'reserve' | 'payment'): CompensationActions {
    this.logger.warn(`Saga compensation triggered at step: ${failedStep}`);

    if (failedStep === 'reserve') {
      return { releaseStock: false, cancelPayment: false, deleteOrder: true };
    }

    if (failedStep === 'payment') {
      return { releaseStock: true, cancelPayment: true, deleteOrder: false };
    }

    return { releaseStock: false, cancelPayment: false, deleteOrder: false };
  }

  validateTransition(from: OrderStatus, to: OrderStatus): boolean {
    return isValidTransition(from, to);
  }

  canUserCancel(status: OrderStatus): boolean {
    return canCancel(status);
  }
}
