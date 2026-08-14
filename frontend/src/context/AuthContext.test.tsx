import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { apiClient } from '../api/client';
import { setAccessToken } from '../api/auth';

vi.mock('../api/client', () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    statusCode: number;
    code?: string;
    requestId?: string;
    constructor(statusCode: number, message: string, opts: { code?: string; requestId?: string } = {}) {
      super(message);
      this.statusCode = statusCode;
      this.code = opts.code;
      this.requestId = opts.requestId;
    }
  },
}));

const apiClientMock = vi.mocked(apiClient);

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

function mockLoginResponse() {
  return {
    accessToken: 'access-1',
    user: { id: 'u1', email: 'a@b.com', role: 'user', emailVerified: true },
  };
}

beforeEach(() => {
  apiClientMock.mockReset();
  setAccessToken(null);
});

describe('AuthContext', () => {
  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login stores user and token in memory only', async () => {
    apiClientMock.mockResolvedValue(mockLoginResponse());

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('a@b.com', 'password123');
    });

    expect(apiClientMock).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'password123' }),
    });
    expect(result.current.user?.email).toBe('a@b.com');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('login propagates API errors', async () => {
    apiClientMock.mockRejectedValue(new Error('Credenciales inválidas'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => result.current.login('a@b.com', 'bad')),
    ).rejects.toThrow('Credenciales inválidas');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logout clears session and notifies backend', async () => {
    apiClientMock.mockResolvedValue(mockLoginResponse());

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('a@b.com', 'password123');
    });

    apiClientMock.mockResolvedValue({ success: true });

    await act(async () => {
      await result.current.logout();
    });

    expect(apiClientMock).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('refresh calls the refresh endpoint and rotates token', async () => {
    // boot consume un refresh al montar el provider
    apiClientMock
      .mockResolvedValueOnce({ accessToken: 'access-boot' })
      .mockResolvedValueOnce({ accessToken: 'access-2' })
      .mockResolvedValueOnce({ accessToken: 'access-3' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(apiClientMock).toHaveBeenCalledTimes(1));

    const first = await act(async () => result.current.refresh());
    const second = await act(async () => result.current.refresh());

    expect(first).toEqual({ accessToken: 'access-2' });
    expect(second).toEqual({ accessToken: 'access-3' });
    expect(apiClientMock).toHaveBeenCalledWith('/auth/refresh', { method: 'POST' });
  });

  it('returns null from refresh when the endpoint fails (session expired)', async () => {
    apiClientMock.mockRejectedValue(new Error('session expired'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    const outcome = await act(async () => result.current.refresh());

    expect(outcome).toBeNull();
  });
});
