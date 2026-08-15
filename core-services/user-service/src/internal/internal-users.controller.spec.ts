import { Test, TestingModule } from '@nestjs/testing';
import { InternalUsersController } from './internal-users.controller';
import { InternalUsersService } from './internal-users.service';

describe('InternalUsersController', () => {
  let controller: InternalUsersController;
  const internalUsersService = { upsertProfile: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalUsersController],
      providers: [{ provide: InternalUsersService, useValue: internalUsersService }],
    }).compile();
    controller = module.get<InternalUsersController>(InternalUsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /internal/users delegates the payload to the service', async () => {
    const dto = { id: 'u1', email: 'a@example.com', firstName: 'Ana' };
    internalUsersService.upsertProfile.mockResolvedValue({ userId: 'u1' });

    const result = await controller.create(dto);

    expect(internalUsersService.upsertProfile).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ userId: 'u1' });
  });
});
