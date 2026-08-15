import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Index('uq_users_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ name: 'first_name', type: 'varchar', nullable: true, length: 100 })
  firstName!: string | null; // ← Permitir null

  @Column({ name: 'last_name', type: 'varchar', nullable: true, length: 100 })
  lastName!: string | null; // ← Permitir null

  @Column({ type: 'varchar', default: 'user', length: 20 })
  role!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ name: 'reset_token', type: 'varchar', nullable: true, length: 500 })
  resetToken!: string | null; // ← Permitir null

  @Column({ name: 'reset_token_expires', type: 'datetime', nullable: true })
  resetTokenExpires!: Date | null; // ← Permitir null

  @Column({ name: 'login_attempts', type: 'int', default: 0 })
  loginAttempts!: number;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil!: Date | null; // ← Permitir null

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  lastLogin!: Date | null; // ← Permitir null

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
