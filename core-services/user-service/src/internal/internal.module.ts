import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternalUsersController } from './internal-users.controller';
import { InternalUsersService } from './internal-users.service';
import { UserProfile } from '../profiles/entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile])],
  controllers: [InternalUsersController],
  providers: [InternalUsersService],
})
export class InternalModule {}
