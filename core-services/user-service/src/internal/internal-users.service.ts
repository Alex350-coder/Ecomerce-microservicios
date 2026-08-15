import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../profiles/entities/user-profile.entity';
import { InternalCreateUserDto } from './dto/internal-create-user.dto';

@Injectable()
export class InternalUsersService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
  ) {}

  async upsertProfile(dto: InternalCreateUserDto): Promise<UserProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId: dto.id } });

    if (!profile) {
      profile = this.profileRepo.create({
        userId: dto.id,
        email: dto.email,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
      });
    } else {
      if (dto.email !== undefined) {
        profile.email = dto.email;
      }
      if (dto.firstName !== undefined) {
        profile.firstName = dto.firstName;
      }
      if (dto.lastName !== undefined) {
        profile.lastName = dto.lastName;
      }
    }

    return this.profileRepo.save(profile);
  }
}
