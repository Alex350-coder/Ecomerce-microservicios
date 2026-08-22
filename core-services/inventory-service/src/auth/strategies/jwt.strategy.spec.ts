import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const strategy = new JwtStrategy(configService);

  it('returns userId, email, and role from the JWT payload', () => {
    const result = strategy.validate({ sub: 'u-1', email: 'a@b.com', role: 'user' });
    expect(result).toEqual({ userId: 'u-1', email: 'a@b.com', role: 'user' });
  });

  it('handles admin role', () => {
    const result = strategy.validate({ sub: 'admin-1', email: 'admin@b.com', role: 'admin' });
    expect(result.role).toBe('admin');
  });
});
