import type { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const config = {
    get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined),
  } as unknown as ConfigService;

  it('validates a payload into a JwtUser', () => {
    const strategy = new JwtStrategy(config);
    const user = strategy.validate({ sub: 'u1', email: 'a@example.com', role: 'admin' });
    expect(user).toEqual({ userId: 'u1', email: 'a@example.com', role: 'admin' });
  });

  it('fails fast when JWT_SECRET is missing', () => {
    const emptyConfig = { get: () => undefined } as unknown as ConfigService;
    expect(() => new JwtStrategy(emptyConfig)).toThrow();
  });
});
