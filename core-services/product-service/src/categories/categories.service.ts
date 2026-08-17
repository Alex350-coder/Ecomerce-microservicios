import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { slugify } from '../common/utils/slugify';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const toCategoryDto = (category: Category): CategoryDto => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  isActive: category.isActive,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<CategoryDto[]> {
    const categories = await this.categoryRepo.find({
      where: { isActive: true, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
    return categories.map(toCategoryDto);
  }

  async create(dto: CreateCategoryDto, actor: JwtUser): Promise<CategoryDto> {
    const slug = slugify(dto.name);
    const existing = await this.categoryRepo.findOne({
      where: { slug, deletedAt: IsNull() },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una categoría con slug "${slug}"`);
    }

    const entity = this.categoryRepo.create({
      name: dto.name,
      slug,
      isActive: true,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });
    return toCategoryDto(await this.categoryRepo.save(entity));
  }

  async update(id: string, dto: UpdateCategoryDto, actor: JwtUser): Promise<CategoryDto> {
    const category = await this.findForAdmin(id);
    const changes: Partial<Category> = { ...dto, updatedBy: actor.userId };

    if (dto.name) {
      const slug = slugify(dto.name);
      const existing = await this.categoryRepo.findOne({
        where: { slug, deletedAt: IsNull() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Ya existe una categoría con slug "${slug}"`);
      }
      changes.slug = slug;
    }

    return toCategoryDto(await this.categoryRepo.save(this.categoryRepo.merge(category, changes)));
  }

  async remove(id: string, actor: JwtUser): Promise<void> {
    await this.findForAdmin(id);

    const referenced = await this.productRepo.exist({
      where: { categoryId: id, deletedAt: IsNull() },
    });
    if (referenced) {
      throw new ConflictException(
        'No se puede eliminar una categoría que tiene productos asociados',
      );
    }

    await this.categoryRepo.update(id, {
      updatedBy: actor.userId,
      isActive: false,
      deletedAt: new Date(),
    });
  }

  private async findForAdmin(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }
    return category;
  }
}
