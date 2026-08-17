import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
@Index('uq_products_slug', ['slug'], { unique: true })
@Index('idx_products_category', ['categoryId'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 220 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Column({ name: 'discount_percent', type: 'int', nullable: true })
  discountPercent!: number | null;

  @Column({ name: 'valid_from', type: 'datetime', nullable: true })
  validFrom!: Date | null;

  @Column({ name: 'valid_to', type: 'datetime', nullable: true })
  validTo!: Date | null;

  @Column({ name: 'category_id', type: 'varchar', length: 36 })
  categoryId!: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Column({ type: 'simple-json' })
  images!: string[];

  @Column({ type: 'simple-json' })
  features!: string[];

  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  rating!: string | null;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  reviewCount!: number;

  @Column({ name: 'is_new', default: false })
  isNew!: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 36, nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 36, nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt!: Date | null;
}
