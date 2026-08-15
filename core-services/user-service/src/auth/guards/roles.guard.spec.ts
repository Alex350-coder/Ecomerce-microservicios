import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const reflector = { getAllAndOverride: jest.fn() };

  const mockContext = (user?: { role?: string }) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as Parameters<RolesGuard['canActivate']>[0];

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext({ role: 'user' }))).toBe(true);
  });

  it('allows access when the user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    expect(guard.canActivate(mockContext({ role: 'admin' }))).toBe(true);
  });

  it('denies access when the user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    expect(guard.canActivate(mockContext({ role: 'user' }))).toBe(false);
  });

  it('denies access when there is no user', () => {
    reflector.getAllAndOverride.mockReturnValue(['user']);
    expect(guard.canActivate(mockContext())).toBe(false);
  });
});
