import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalUsersService } from './internal-users.service';
import { UserProfile } from '../profiles/entities/user-profile.entity';

describe('InternalUsersService', () => {
  let service: InternalUsersService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalUsersService,
        { provide: getRepositoryToken(UserProfile), useValue: repo },
      ],
    }).compile();
    service = module.get<InternalUsersService>(InternalUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a profile from the sync payload when it does not exist', async () => {
    repo.findOne.mockResolvedValue(null);
    const created = { userId: 'u1' };
    repo.create.mockReturnValue(created);
    repo.save.mockImplementation(async (p: unknown) => p);

    const result = await service.upsertProfile({
      id: 'u1',
      email: 'a@example.com',
      firstName: 'Ana',
      lastName: 'Lopez',
    });

    expect(repo.create).toHaveBeenCalledWith({
      userId: 'u1',
      email: 'a@example.com',
      firstName: 'Ana',
      lastName: 'Lopez',
    });
    expect(repo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  it('is idempotent: updates the existing profile on repeat calls', async () => {
    const existing = { id: 'p1', userId: 'u1', email: 'old@example.com', firstName: null };
    repo.findOne.mockResolvedValue(existing);
    repo.save.mockImplementation(async (p: unknown) => p);

    const result = await service.upsertProfile({
      id: 'u1',
      email: 'new@example.com',
      firstName: 'Ana',
      lastName: 'Lopez',
    });

    expect(repo.create).not.toHaveBeenCalled();
    expect(result.email).toBe('new@example.com');
    expect(result.firstName).toBe('Ana');
  });

  it('handles payloads without names using null defaults', async () => {
    repo.findOne.mockResolvedValue(null);
    const created = { userId: 'u2' };
    repo.create.mockReturnValue(created);
    repo.save.mockImplementation(async (p: unknown) => p);

    const result = await service.upsertProfile({ id: 'u2', email: 'b@example.com' });

    expect(repo.create).toHaveBeenCalledWith({
      userId: 'u2',
      email: 'b@example.com',
      firstName: null,
      lastName: null,
    });
    expect(result).toEqual(created);
  });
});
