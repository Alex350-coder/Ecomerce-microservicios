let accessToken: string | null = null;
let refreshHandler: (() => Promise<{ accessToken: string } | null>) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setRefreshHandler(
  handler: (() => Promise<{ accessToken: string } | null>) | null,
): void {
  refreshHandler = handler;
}

export function getRefreshHandler(): (() => Promise<{ accessToken: string } | null>) | null {
  return refreshHandler;
}
