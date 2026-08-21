import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/auth/guards/roles.guard';

describe('Security: Guards (auth-service)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  describe('RolesGuard', () => {
    it('B1: allows access when no roles required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx = createMockContext({ role: 'user' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('B2: rejects user accessing admin endpoint (returns false)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const ctx = createMockContext({ role: 'user' });

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('B3: allows admin accessing admin endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const ctx = createMockContext({ role: 'admin' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('B1: rejects unauthenticated request (no user) — returns false', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user']);
      const ctx = createMockContext(null);

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('B4: rejects role escalation via body (role not from token)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const ctx = createMockContext({ role: 'user' });

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('allows user accessing user-only endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user']);
      const ctx = createMockContext({ role: 'user' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows admin accessing user-only endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user']);
      const ctx = createMockContext({ role: 'admin' });

      expect(guard.canActivate(ctx)).toBe(false);
    });
  });
});
