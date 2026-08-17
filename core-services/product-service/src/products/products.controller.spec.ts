import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

describe('ProductsController', () => {
  let controller: ProductsController;
  const productsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const admin: JwtUser = { userId: 'admin-1', email: 'admin@example.com', role: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();
    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /products delegates the query to the service', async () => {
    productsService.findAll.mockResolvedValue({ data: [], meta: {} });
    const query = { search: 'a', page: 1, limit: 12 };

    await controller.findAll(query);

    expect(productsService.findAll).toHaveBeenCalledWith(query);
  });

  it('GET /products/:id delegates the id', async () => {
    productsService.findOne.mockResolvedValue({ id: 'p1' });

    await controller.findOne('p1');

    expect(productsService.findOne).toHaveBeenCalledWith('p1');
  });

  it('POST /products delegates dto and current user to the service', async () => {
    const dto = {
      name: 'X',
      description: 'x',
      price: 1,
      categoryId: 'c1',
      images: [],
      features: [],
    };
    productsService.create.mockResolvedValue({ id: 'p1' });

    await controller.create(dto, admin);

    expect(productsService.create).toHaveBeenCalledWith(dto, admin);
  });

  it('PATCH /products/:id delegates id, dto and user', async () => {
    await controller.update('p1', { price: 2 }, admin);

    expect(productsService.update).toHaveBeenCalledWith('p1', { price: 2 }, admin);
  });

  it('DELETE /products/:id returns 204 without a body', async () => {
    const result = await controller.remove('p1', admin);

    expect(productsService.remove).toHaveBeenCalledWith('p1', admin);
    expect(result).toBeUndefined();
  });
});
