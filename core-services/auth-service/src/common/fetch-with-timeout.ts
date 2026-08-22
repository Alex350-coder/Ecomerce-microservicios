const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1_000;

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = MAX_RETRIES, ...fetchOptions } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok || !isRetryableStatus(response.status)) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);

      if (attempt < maxRetries) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    } catch (error) {
      clearTimeout(timer);

      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`Timeout after ${timeoutMs}ms`);
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      if (attempt < maxRetries) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError ?? new Error('Fetch failed after retries');
}
