import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('should be defined', () => {
    const configService = { get: () => 'test-secret' } as unknown as ConfigService;
    expect(new JwtStrategy(configService)).toBeDefined();
  });

  describe('validate', () => {
    it('maps the JWT payload to a request user', () => {
      const configService = { get: () => 'test-secret' } as unknown as ConfigService;
      const strategy = new JwtStrategy(configService);

      const result = strategy.validate({
        sub: 'user-1',
        email: 'ana@example.com',
        role: 'customer',
      });

      expect(result).toEqual({ userId: 'user-1', email: 'ana@example.com', role: 'customer' });
    });
  });
});
