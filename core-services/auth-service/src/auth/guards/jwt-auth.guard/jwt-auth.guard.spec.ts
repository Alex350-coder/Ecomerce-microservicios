import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtStrategy } from '../../strategies/jwt.strategy/jwt.strategy';

const TEST_SECRET = 'test-secret-at-least-16-chars';

@Controller('protected')
class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  get(@CurrentUser() user: { userId: string; email: string; role: string }) {
    return { user };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdmin(@CurrentUser() user: { userId: string; email: string; role: string }) {
    return { user };
  }
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({ secret: TEST_SECRET, signOptions: { expiresIn: '15m' } }),
  ],
  controllers: [ProtectedController],
  providers: [
    {
      provide: ConfigService,
      useValue: { get: (key: string) => (key === 'JWT_SECRET' ? TEST_SECRET : undefined) },
    },
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
})
class TestAppModule {}

describe('JwtAuthGuard (integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  function sign(role: string): string {
    return jwtService.sign({ sub: 'user-1', email: 'ana@example.com', role });
  }

  it('rejects a request without a token (401)', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('rejects an invalid token (401)', async () => {
    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  it('accepts a valid token and exposes the current user (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${sign('customer')}`)
      .expect(200);

    expect(res.body.user.userId).toBe('user-1');
    expect(res.body.user.email).toBe('ana@example.com');
    expect(res.body.user.role).toBe('customer');
  });

  it('forbids a customer from an admin-only route (403)', async () => {
    await request(app.getHttpServer())
      .get('/protected/admin-only')
      .set('Authorization', `Bearer ${sign('customer')}`)
      .expect(403);
  });

  it('allows an admin on an admin-only route (200)', async () => {
    await request(app.getHttpServer())
      .get('/protected/admin-only')
      .set('Authorization', `Bearer ${sign('admin')}`)
      .expect(200);
  });
});
