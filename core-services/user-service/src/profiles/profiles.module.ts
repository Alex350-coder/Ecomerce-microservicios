import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProfilesController } from './profiles.controller';
import { AddressesController } from './addresses.controller';
import { ProfilesService } from './profiles.service';
import { AddressesService } from './addresses.service';
import { UserProfile } from './entities/user-profile.entity';
import { Address } from './entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile, Address]), AuthModule],
  controllers: [ProfilesController, AddressesController],
  providers: [ProfilesService, AddressesService],
})
export class ProfilesModule {}
