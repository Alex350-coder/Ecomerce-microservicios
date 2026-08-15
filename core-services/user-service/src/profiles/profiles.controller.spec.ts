import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  const profilesService = { getProfile: jest.fn(), updateProfile: jest.fn() };

  const requester: JwtUser = { userId: 'user-1', email: 'user@example.com', role: 'user' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [{ provide: ProfilesService, useValue: profilesService }],
    }).compile();
    controller = module.get<ProfilesController>(ProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET profile/:id delegates to the service with the id and current user', async () => {
    profilesService.getProfile.mockResolvedValue({ userId: 'user-1' });

    const result = await controller.getProfile('user-1', requester);

    expect(profilesService.getProfile).toHaveBeenCalledWith('user-1', requester);
    expect(result).toEqual({ userId: 'user-1' });
  });

  it('PATCH profile/:id delegates the dto to the service', async () => {
    const dto = { firstName: 'Ana', phone: '999' };
    profilesService.updateProfile.mockResolvedValue({ userId: 'user-1', ...dto });

    const result = await controller.updateProfile('user-1', requester, dto);

    expect(profilesService.updateProfile).toHaveBeenCalledWith('user-1', requester, dto);
    expect(result.firstName).toBe('Ana');
  });
});
