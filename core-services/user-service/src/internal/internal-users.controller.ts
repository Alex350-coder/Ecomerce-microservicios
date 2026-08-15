import { Body, Controller, Post } from '@nestjs/common';
import { InternalUsersService } from './internal-users.service';
import { InternalCreateUserDto } from './dto/internal-create-user.dto';

@Controller('internal')
export class InternalUsersController {
  constructor(private readonly internalUsersService: InternalUsersService) {}

  @Post('users')
  async create(@Body() dto: InternalCreateUserDto) {
    return this.internalUsersService.upsertProfile(dto);
  }
}
