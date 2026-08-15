import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { UserProfile } from './entities/user-profile.entity';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

describe('ProfilesService', () => {
  let service: ProfilesService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const requester: JwtUser = { userId: 'user-1', email: 'user@example.com', role: 'user' };
  const admin: JwtUser = { userId: 'admin-1', email: 'admin@example.com', role: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfilesService, { provide: getRepositoryToken(UserProfile), useValue: repo }],
    }).compile();
    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('returns the existing profile for the owner', async () => {
      const profile = { id: 'p1', userId: 'user-1', email: 'user@example.com' };
      repo.findOne.mockResolvedValue(profile);

      const result = await service.getProfile('user-1', requester);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(result).toEqual(profile);
    });

    it('lazily creates a default profile when none exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = { userId: 'user-1' };
      repo.create.mockReturnValue(created);
      repo.save.mockImplementation(async (p: unknown) => p);

      const result = await service.getProfile('user-1', requester);

      expect(repo.create).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('allows an admin to read any profile', async () => {
      const profile = { id: 'p2', userId: 'user-9' };
      repo.findOne.mockResolvedValue(profile);

      const result = await service.getProfile('user-9', admin);

      expect(result).toEqual(profile);
    });

    it('throws NotFoundException when the requester is not owner nor admin', async () => {
      await expect(service.getProfile('user-9', requester)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('persists the provided fields for the owner', async () => {
      const existing = { id: 'p1', userId: 'user-1', firstName: 'Old' };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation(async (p: unknown) => p);

      const dto = { firstName: 'New', phone: '123' };
      const result = await service.updateProfile('user-1', requester, dto);

      expect(result.firstName).toBe('New');
      expect(result.phone).toBe('123');
      expect(repo.save).toHaveBeenCalledWith(existing);
    });

    it('creates a profile first when it does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = { userId: 'user-1' };
      repo.create.mockReturnValue(created);
      repo.save.mockImplementation(async (p: unknown) => p);

      const result = await service.updateProfile('user-1', requester, { lastName: 'L' });

      expect(repo.create).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(result.lastName).toBe('L');
    });

    it('throws NotFoundException for a non-owner, non-admin requester', async () => {
      await expect(
        service.updateProfile('user-9', requester, { firstName: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
