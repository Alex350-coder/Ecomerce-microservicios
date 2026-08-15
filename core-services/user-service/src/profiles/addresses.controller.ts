import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get(':userId/addresses')
  async listAddresses(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.addressesService.listAddresses(userId, user);
  }

  @Post(':userId/addresses')
  async createAddress(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.createAddress(userId, user, dto);
  }

  @Patch(':userId/addresses/:addressId')
  async updateAddress(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.updateAddress(userId, addressId, user, dto);
  }

  @Delete(':userId/addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAddress(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    return this.addressesService.deleteAddress(userId, addressId, user);
  }
}
