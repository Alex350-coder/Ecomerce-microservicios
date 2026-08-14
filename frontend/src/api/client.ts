import { getAccessToken, getRefreshHandler, setAccessToken } from './auth';

export { setAccessToken, setRefreshHandler, getAccessToken } from './auth';

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    options: { code?: string; requestId?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  requestId?: string;
  details?: unknown;
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }

  const message = Array.isArray(body?.message)
    ? body!.message.join(', ')
    : (body?.message ?? (response.statusText || 'Error de red'));
  return new ApiError(body?.statusCode ?? response.status, message, {
    code: body?.error,
    requestId: body?.requestId,
    details: body?.details,
  });
}

async function request(path: string, init: RequestInit): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }
}

export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isRefreshAttempt = path === '/auth/refresh';

  let response = await request(path, init);

  if (response.status === 401 && !isRefreshAttempt) {
    const refresh = getRefreshHandler();
    const result = refresh ? await refresh() : null;

    if (result) {
      setAccessToken(result.accessToken);
      response = await request(path, init);
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
