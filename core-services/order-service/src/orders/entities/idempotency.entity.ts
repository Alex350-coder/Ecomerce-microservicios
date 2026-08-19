import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity('idempotency')
export class Idempotency {
  @PrimaryColumn({ name: 'key', type: 'varchar', length: 36 })
  key!: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 36 })
  resourceId!: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 50 })
  resourceType!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
