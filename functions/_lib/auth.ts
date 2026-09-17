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
 * Encodes a UTF-8 string into a URL-safe Base64 (Base64URL) string without padding.
 */
export function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a URL-safe Base64 (Base64URL) string back into a UTF-8 string.
 */
export function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Creates Set-Cookie string with signed session token
 */
export async function createSessionCookie(
  user: SessionUser,
  secret: string
): Promise<string> {
  const payload = toBase64Url(JSON.stringify(user));
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
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const name = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (name === COOKIE_NAME && val) {
        return val;
      }
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
    let json: string;
    try {
      json = fromBase64Url(payload);
    } catch {
      json = payload;
    }
    const user = JSON.parse(json);
    if (user && user.id && user.name && user.authProvider) {
      return user as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}
