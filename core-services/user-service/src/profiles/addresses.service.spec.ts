import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

describe('AddressesService', () => {
  let service: AddressesService;
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const requester: JwtUser = { userId: 'user-1', email: 'user@example.com', role: 'user' };
  const admin: JwtUser = { userId: 'admin-1', email: 'admin@example.com', role: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressesService, { provide: getRepositoryToken(Address), useValue: repo }],
    }).compile();
    service = module.get<AddressesService>(AddressesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listAddresses', () => {
    it('returns the addresses of the owner ordered by creation', async () => {
      repo.find.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

      const result = await service.listAddresses('user-1', requester);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('allows an admin to list any user addresses', async () => {
      repo.find.mockResolvedValue([]);
      await service.listAddresses('user-9', admin);
      expect(repo.find).toHaveBeenCalled();
    });

    it('throws NotFoundException for a non-owner requester', async () => {
      await expect(service.listAddresses('user-9', requester)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.find).not.toHaveBeenCalled();
    });
  });

  describe('createAddress', () => {
    it('creates an address bound to the owner', async () => {
      repo.count.mockResolvedValue(2);
      const dto = { label: 'Casa', street: 'Av. Siempre Viva', city: 'Lima', country: 'Peru' };
      const created = { ...dto, userId: 'user-1' };
      repo.create.mockReturnValue(created);
      repo.save.mockImplementation(async (p: unknown) => p);

      const result = await service.createAddress('user-1', requester, dto);

      expect(repo.create).toHaveBeenCalledWith({ ...dto, userId: 'user-1' });
      expect(result.userId).toBe('user-1');
      expect(result.label).toBe('Casa');
    });

    it('unsets other defaults when the new address is default', async () => {
      repo.count.mockResolvedValue(1);
      repo.save.mockImplementation(async (p: unknown) => p);
      repo.create.mockReturnValue({ userId: 'user-1', isDefault: true });

      await service.createAddress('user-1', requester, {
        label: 'Trabajo',
        street: 'Calle 1',
        city: 'Lima',
        country: 'Peru',
        isDefault: true,
      });

      expect(repo.update).toHaveBeenCalledWith(
        { userId: 'user-1', isDefault: true },
        { isDefault: false },
      );
    });

    it('makes the first address the default automatically', async () => {
      repo.count.mockResolvedValue(0);
      repo.save.mockImplementation(async (p: unknown) => p);
      const created = { userId: 'user-1', isDefault: false };
      repo.create.mockReturnValue(created);

      const result = await service.createAddress('user-1', requester, {
        label: 'Casa',
        street: 'Av 1',
        city: 'Lima',
        country: 'Peru',
      });

      expect(result.isDefault).toBe(true);
    });

    it('throws NotFoundException for a non-owner requester', async () => {
      await expect(
        service.createAddress('user-9', requester, {
          label: 'Casa',
          street: 'Av 1',
          city: 'Lima',
          country: 'Peru',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateAddress', () => {
    it('applies changes to an existing address of the owner', async () => {
      const existing = { id: 'a1', userId: 'user-1', label: 'Casa' };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation(async (p: unknown) => p);

      const result = await service.updateAddress('user-1', 'a1', requester, { label: 'Oficina' });

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'a1', userId: 'user-1' } });
      expect(result.label).toBe('Oficina');
    });

    it('unsets other defaults when the update sets default true', async () => {
      repo.findOne.mockResolvedValue({ id: 'a1', userId: 'user-1' });
      repo.save.mockImplementation(async (p: unknown) => p);

      await service.updateAddress('user-1', 'a1', requester, { isDefault: true });

      expect(repo.update).toHaveBeenCalledWith(
        { userId: 'user-1', isDefault: true },
        { isDefault: false },
      );
    });

    it('throws NotFoundException when the address does not belong to the requester', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.updateAddress('user-1', 'a1', requester, { label: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException for a non-owner requester', async () => {
      await expect(
        service.updateAddress('user-9', 'a1', requester, { label: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteAddress', () => {
    it('removes an address of the owner', async () => {
      const existing = { id: 'a1', userId: 'user-1' };
      repo.findOne.mockResolvedValue(existing);

      await service.deleteAddress('user-1', 'a1', requester);

      expect(repo.remove).toHaveBeenCalledWith(existing);
    });

    it('allows an admin to delete any address', async () => {
      const existing = { id: 'a1', userId: 'user-9' };
      repo.findOne.mockResolvedValue(existing);

      await service.deleteAddress('user-9', 'a1', admin);

      expect(repo.remove).toHaveBeenCalledWith(existing);
    });

    it('throws NotFoundException when the address does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.deleteAddress('user-1', 'a1', requester)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
