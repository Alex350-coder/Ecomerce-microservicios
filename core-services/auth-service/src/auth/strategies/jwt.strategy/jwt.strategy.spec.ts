import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('should be defined', () => {
    const configService = { get: () => 'test-secret' } as unknown as ConfigService;
    expect(new JwtStrategy(configService)).toBeDefined();
  });
});
