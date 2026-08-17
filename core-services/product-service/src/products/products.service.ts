import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, IsNull, Like, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto, ProductSort } from './dto/list-products-query.dto';
import { ProductDto, toProductDto } from './product.mapper';
import { slugify } from '../common/utils/slugify';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 12;

const SORT_ORDERS: Record<ProductSort, FindOptionsOrder<Product>> = {
  [ProductSort.NAME]: { name: 'ASC' },
  [ProductSort.PRICE_ASC]: { price: 'ASC' },
  [ProductSort.PRICE_DESC]: { price: 'DESC' },
  [ProductSort.RATING]: { rating: 'DESC', name: 'ASC' },
  [ProductSort.NEWEST]: { createdAt: 'DESC' },
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(query: ListProductsQueryDto): Promise<PaginatedResult<ProductDto>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const where: FindOptionsWhere<Product> = { isActive: true, deletedAt: IsNull() };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
    if (query.search?.trim()) where.name = Like(`%${query.search.trim()}%`);

    const [rows, total] = await this.productRepo.findAndCount({
      where,
      relations: { category: true },
      order: SORT_ORDERS[query.sort ?? ProductSort.NAME],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rows.map((product) => toProductDto(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ProductDto> {
    return toProductDto(await this.findPublic(id));
  }

  async create(dto: CreateProductDto, actor: JwtUser): Promise<ProductDto> {
    const category = await this.findActiveCategory(dto.categoryId);

    const entity = this.productRepo.create({
      ...dto,
      slug: await this.uniqueSlug(dto.name),
      price: dto.price.toFixed(2),
      rating: dto.rating !== undefined ? dto.rating.toFixed(1) : null,
      reviewCount: dto.reviewCount ?? 0,
      isNew: dto.isNew ?? false,
      isFeatured: dto.isFeatured ?? false,
      isActive: dto.isActive ?? true,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    const saved = await this.productRepo.save(entity);
    saved.category = category;
    return toProductDto(saved);
  }

  async update(id: string, dto: UpdateProductDto, actor: JwtUser): Promise<ProductDto> {
    const product = await this.findForAdmin(id);

    if (dto.categoryId) {
      await this.findActiveCategory(dto.categoryId);
    }

    const changes: Partial<Product> = {
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      images: dto.images,
      features: dto.features,
      discountPercent: dto.discountPercent,
      validFrom: dto.validFrom,
      validTo: dto.validTo,
      reviewCount: dto.reviewCount,
      isNew: dto.isNew,
      isFeatured: dto.isFeatured,
      isActive: dto.isActive,
      price: dto.price !== undefined ? dto.price.toFixed(2) : undefined,
      rating: dto.rating !== undefined ? dto.rating.toFixed(1) : undefined,
      updatedBy: actor.userId,
    };
    if (dto.name) changes.slug = await this.uniqueSlug(dto.name);

    return toProductDto(await this.productRepo.save(this.productRepo.merge(product, changes)));
  }

  async remove(id: string, actor: JwtUser): Promise<void> {
    await this.findForAdmin(id);
    await this.productRepo.update(id, {
      updatedBy: actor.userId,
      isActive: false,
      deletedAt: new Date(),
    });
  }

  private async findActiveCategory(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
    });
    if (!category) {
      throw new BadRequestException('La categoría especificada no existe o está inactiva');
    }
    return category;
  }

  private async findPublic(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return product;
  }

  private async findForAdmin(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return product;
  }

  private async uniqueSlug(baseName: string): Promise<string> {
    const base = slugify(baseName);
    let candidate = base;
    let n = 2;
    while (await this.productRepo.exist({ where: { slug: candidate } })) {
      candidate = `${base}-${n}`;
      n += 1;
    }
    return candidate;
  }
}
