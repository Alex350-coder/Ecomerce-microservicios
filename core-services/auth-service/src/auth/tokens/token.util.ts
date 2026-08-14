import { createHash, randomBytes } from 'crypto';

export const REFRESH_COOKIE_NAME = 'refresh_token';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}
