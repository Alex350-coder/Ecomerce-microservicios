import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  const categoriesService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const admin: JwtUser = { userId: 'admin-1', email: 'admin@example.com', role: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: categoriesService }],
    }).compile();
    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /categories delegates to the service', async () => {
    categoriesService.findAll.mockResolvedValue([]);

    await controller.findAll();

    expect(categoriesService.findAll).toHaveBeenCalled();
  });

  it('POST /categories delegates dto and current user', async () => {
    categoriesService.create.mockResolvedValue({ id: 'c1' });

    await controller.create({ name: 'Audio' }, admin);

    expect(categoriesService.create).toHaveBeenCalledWith({ name: 'Audio' }, admin);
  });

  it('PATCH /categories/:id delegates id, dto and user', async () => {
    await controller.update('c1', { name: 'Audio Pro' }, admin);

    expect(categoriesService.update).toHaveBeenCalledWith('c1', { name: 'Audio Pro' }, admin);
  });

  it('DELETE /categories/:id returns 204 without a body', async () => {
    const result = await controller.remove('c1', admin);

    expect(categoriesService.remove).toHaveBeenCalledWith('c1', admin);
    expect(result).toBeUndefined();
  });
});
