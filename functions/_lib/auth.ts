import { signToken, verifyToken } from '../../src/utils/security';

export interface SessionUser {
  id: string;
  name: string;
  avatarUrl?: string;
  authProvider: 'google' | 'x';
}

const COOKIE_NAME = 'poke_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Creates Set-Cookie string with signed session token
 */
export async function createSessionCookie(
  user: SessionUser,
  secret: string
): Promise<string> {
  const payload = JSON.stringify(user);
  const token = await signToken(payload, secret);
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_DURATION_SECONDS}; HttpOnly; SameSite=Lax; Secure`;
}

/**
 * Parses session token from Cookie header or raw Set-Cookie string
 */
export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [name, val] = part.trim().split('=');
    if (name === COOKIE_NAME && val) {
      return val;
    }
  }
  return null;
}

/**
 * Verifies session token and restores SessionUser
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionUser | null> {
  const payload = await verifyToken(token, secret);
  if (!payload) return null;

  try {
    const user = JSON.parse(payload);
    if (user && user.id && user.name && user.authProvider) {
      return user as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}
