import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('addresses')
@Index(['userId'])
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  label!: string;

  @Column({ name: 'recipient_name', type: 'varchar', length: 100, nullable: true })
  recipientName!: string | null;

  @Column({ type: 'varchar', length: 200 })
  street!: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ name: 'zip_code', type: 'varchar', length: 20, nullable: true })
  zipCode!: string | null;

  @Column({ type: 'varchar', length: 100 })
  country!: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
