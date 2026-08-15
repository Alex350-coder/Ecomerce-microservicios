import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

describe('AddressesController', () => {
  let controller: AddressesController;
  const addressesService = {
    listAddresses: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
  };

  const requester: JwtUser = { userId: 'user-1', email: 'user@example.com', role: 'user' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [{ provide: AddressesService, useValue: addressesService }],
    }).compile();
    controller = module.get<AddressesController>(AddressesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET :userId/addresses delegates to the service', async () => {
    await controller.listAddresses('user-1', requester);
    expect(addressesService.listAddresses).toHaveBeenCalledWith('user-1', requester);
  });

  it('POST :userId/addresses delegates the dto to the service', async () => {
    const dto = { label: 'Casa', street: 'Av 1', city: 'Lima', country: 'Peru' };
    await controller.createAddress('user-1', requester, dto);
    expect(addressesService.createAddress).toHaveBeenCalledWith('user-1', requester, dto);
  });

  it('PATCH :userId/addresses/:addressId delegates the dto to the service', async () => {
    const dto = { label: 'Oficina' };
    await controller.updateAddress('user-1', 'a1', requester, dto);
    expect(addressesService.updateAddress).toHaveBeenCalledWith('user-1', 'a1', requester, dto);
  });

  it('DELETE :userId/addresses/:addressId delegates to the service', async () => {
    await controller.deleteAddress('user-1', 'a1', requester);
    expect(addressesService.deleteAddress).toHaveBeenCalledWith('user-1', 'a1', requester);
  });
});
