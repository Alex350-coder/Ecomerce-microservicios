import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function createContext(
  user: unknown,
  rolesMeta: string[] | undefined,
): { reflector: Reflector; context: ExecutionContext } {
  const switchToHttp = {
    getRequest: () => ({ user }),
  };
  const context = {
    getHandler: () => ({ handler: true }),
    getClass: () => ({ class: true }),
    switchToHttp: () => switchToHttp,
  } as unknown as ExecutionContext;
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(rolesMeta),
  } as unknown as Reflector;
  return { reflector, context };
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard({} as Reflector);
  });

  it('allows access when no roles are required', () => {
    const { reflector, context } = createContext({ role: 'customer' }, undefined);
    guard = new RolesGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when the user role matches', () => {
    const { reflector, context } = createContext({ role: 'admin' }, ['admin']);
    guard = new RolesGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when the user role does not match', () => {
    const { reflector, context } = createContext({ role: 'customer' }, ['admin']);
    guard = new RolesGuard(reflector);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access when no user is present and roles are required', () => {
    const { reflector, context } = createContext(undefined, ['admin']);
    guard = new RolesGuard(reflector);

    expect(guard.canActivate(context)).toBe(false);
  });
});
