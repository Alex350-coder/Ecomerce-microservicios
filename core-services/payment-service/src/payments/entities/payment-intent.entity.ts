import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

@Entity('payment_intents')
@Index('uq_payment_intents_order', ['orderId'], { unique: true })
@Index('uq_payment_intents_idempotency', ['idempotencyKey'], { unique: true })
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'varchar', length: 36 })
  orderId!: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 36 })
  idempotencyKey!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ name: 'method', type: 'varchar', length: 30 })
  method!: PaymentMethod;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ name: 'failure_reason', type: 'varchar', length: 255, nullable: true })
  failureReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
