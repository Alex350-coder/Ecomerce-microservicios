import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;

  const strategy = new JwtStrategy(configService);

  it('returns userId, email, and role from the JWT payload', () => {
    const payload = { sub: 'user-uuid-123', email: 'test@example.com', role: 'user' };
    const result = strategy.validate(payload);
    expect(result).toEqual({ userId: 'user-uuid-123', email: 'test@example.com', role: 'user' });
  });

  it('handles admin role', () => {
    const payload = { sub: 'admin-uuid', email: 'admin@example.com', role: 'admin' };
    const result = strategy.validate(payload);
    expect(result.role).toBe('admin');
  });
});
