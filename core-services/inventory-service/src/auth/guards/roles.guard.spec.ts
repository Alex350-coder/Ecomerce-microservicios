import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  const mockContext = (user?: { role?: string }) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => jest.clearAllMocks());

  it('allows when no roles required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('allows when user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(guard.canActivate(mockContext({ role: 'admin' }))).toBe(true);
  });

  it('denies when user has different role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(guard.canActivate(mockContext({ role: 'user' }))).toBe(false);
  });

  it('denies when user is undefined', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });
});
