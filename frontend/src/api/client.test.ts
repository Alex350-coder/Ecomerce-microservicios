import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError, setAccessToken, setRefreshHandler, API_BASE_URL } from './client';

const base = API_BASE_URL;

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('apiClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    setAccessToken(null);
    setRefreshHandler(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses API_BASE_URL as base and appends the path', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient('/auth/login', { method: 'POST' });

    expect(fetchMock).toHaveBeenCalledWith(`${base}/auth/login`, expect.anything());
  });

  it('sends no Authorization header when no token is set', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient('/products');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('adds Bearer token from the in-memory holder', async () => {
    setAccessToken('abc123');
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient('/auth/me');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('propagates an incoming X-Request-Id and defaults Content-Type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient('/products', {
      method: 'POST',
      headers: { 'X-Request-Id': 'req_42' },
      body: JSON.stringify({ q: 1 }),
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('X-Request-Id')).toBe('req_42');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('parses the JSON body on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [1, 2, 3] }));

    const result = await apiClient<{ data: number[] }>('/products');

    expect(result).toEqual({ data: [1, 2, 3] });
  });

  it('throws ApiError with standard fields on non-2xx', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ statusCode: 401, message: 'Token inválido', error: 'AUTH_INVALID_TOKEN', requestId: 'req_1' }, 401),
    );

    const error = await apiClient('/auth/me').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Token inválido');
    expect(error.code).toBe('AUTH_INVALID_TOKEN');
    expect(error.requestId).toBe('req_1');
  });

  it('falls back to status text when response body has no error shape', async () => {
    fetchMock.mockResolvedValue(jsonResponse('raw text', 500));

    const error = await apiClient('/orders').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(500);
  });

  it('wraps network failures into ApiError 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await apiClient('/products').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(0);
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    setAccessToken('old-token');
    const refresh = vi.fn().mockResolvedValue({ accessToken: 'new-token' });
    setRefreshHandler(refresh);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ statusCode: 401, message: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ me: true }));

    const result = await apiClient<{ me: boolean }>('/auth/me');

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ me: true });

    const retryInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(new Headers(retryInit.headers).get('Authorization')).toBe('Bearer new-token');
  });

  it('throws the original 401 when refresh fails', async () => {
    setAccessToken('old-token');
    const refresh = vi.fn().mockResolvedValue(null);
    setRefreshHandler(refresh);

    fetchMock.mockResolvedValue(jsonResponse({ statusCode: 401, message: 'expired' }, 401));

    const error = await apiClient('/auth/me').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not attempt refresh on 401 for the refresh endpoint itself', async () => {
    setAccessToken('old-token');
    const refresh = vi.fn();
    setRefreshHandler(refresh);

    fetchMock.mockResolvedValue(jsonResponse({ statusCode: 401, message: 'expired' }, 401));

    const error = await apiClient('/auth/refresh', { method: 'POST' }).catch((e) => e);

    expect(error.statusCode).toBe(401);
    expect(refresh).not.toHaveBeenCalled();
  });
});
