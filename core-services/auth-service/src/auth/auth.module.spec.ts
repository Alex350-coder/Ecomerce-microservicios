import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { UserSyncService } from './internal/user-sync.service';
import { User } from './shared/entities/user.entity';
import { RefreshToken } from './shared/entities/refresh-token.entity';

describe('AuthModule', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-0123456789';
  });

  it('compiles the full dependency graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), AuthModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(RefreshToken))
      .useValue({})
      .compile();

    expect(moduleRef.get(UserSyncService)).toBeDefined();
  });
});
