import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { assertOwnershipOrAdmin } from './ownership.util';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
  ) {}

  async getProfile(userId: string, requester: JwtUser): Promise<UserProfile> {
    assertOwnershipOrAdmin(userId, requester);

    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
      profile = await this.profileRepo.save(profile);
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    requester: JwtUser,
    dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    assertOwnershipOrAdmin(userId, requester);

    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
    }

    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }
}
