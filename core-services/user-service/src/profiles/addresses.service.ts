import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { assertOwnershipOrAdmin } from './ownership.util';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  async listAddresses(userId: string, requester: JwtUser): Promise<Address[]> {
    assertOwnershipOrAdmin(userId, requester);
    return this.addressRepo.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async createAddress(userId: string, requester: JwtUser, dto: CreateAddressDto): Promise<Address> {
    assertOwnershipOrAdmin(userId, requester);

    const address = this.addressRepo.create({ ...dto, userId });
    const isFirst = (await this.addressRepo.count({ where: { userId } })) === 0;
    const shouldBeDefault = dto.isDefault === true || isFirst;

    if (shouldBeDefault) {
      await this.unsetDefault(userId);
      address.isDefault = true;
    }

    return this.addressRepo.save(address);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    requester: JwtUser,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    assertOwnershipOrAdmin(userId, requester);

    const address = await this.addressRepo.findOne({ where: { id: addressId, userId } });
    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    if (dto.isDefault === true) {
      await this.unsetDefault(userId);
      address.isDefault = true;
    }

    Object.assign(address, dto);
    return this.addressRepo.save(address);
  }

  async deleteAddress(userId: string, addressId: string, requester: JwtUser): Promise<void> {
    assertOwnershipOrAdmin(userId, requester);

    const address = await this.addressRepo.findOne({ where: { id: addressId, userId } });
    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    await this.addressRepo.remove(address);
  }

  private async unsetDefault(userId: string): Promise<void> {
    await this.addressRepo.update({ userId, isDefault: true }, { isDefault: false });
  }
}
