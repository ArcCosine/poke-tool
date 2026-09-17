/**
 * Security, Validation, and Token Utilities
 * Designed to run seamlessly in both Browser and Cloudflare Edge (Workers / Pages Functions)
 */

/**
 * Validates article URLs to prevent phishing, XSS, and malformed inputs.
 * Accepts only https:// URLs up to 255 characters.
 */
export function isValidArticleUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string' || urlStr.length > 255) {
    return false;
  }

  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Encodes Uint8Array into Hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Imports secret string as HMAC-SHA256 CryptoKey
 */
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Signs payload using HMAC-SHA256 and returns `${payload}.${hexSignature}`
 */
export async function signToken(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const hexSig = bufferToHex(signatureBuffer);
  return `${payload}.${hexSig}`;
}

/**
 * Verifies signed token and returns original payload if valid, or null if invalid/tampered.
 */
export async function verifyToken(token: string, secret: string): Promise<string | null> {
  if (!token || typeof token !== 'string') return null;
  const lastDotIndex = token.lastIndexOf('.');
  if (lastDotIndex <= 0 || lastDotIndex === token.length - 1) return null;

  const payload = token.substring(0, lastDotIndex);
  const expectedToken = await signToken(payload, secret);

  if (token !== expectedToken) {
    return null;
  }

  return payload;
}

/**
 * Calculates ranking score using Design A:
 * ranking_score = (authenticated_likes * 1.0) + (anonymous_likes * 0.2)
 */
export function calculateRankingScore(authLikes: number, anonLikes: number): number {
  const score = authLikes * 1.0 + anonLikes * 0.2;
  return Math.round(score * 100) / 100;
}

/**
 * BOLA (Broken Object Level Authorization) check.
 * Ensures the requesting user owns the target party before updating/deleting.
 */
export function canModifyParty(userId: string | undefined, partyOwnerId: string): boolean {
  if (!userId || !partyOwnerId) return false;
  return userId === partyOwnerId;
}

/**
 * Normalizes query parameters for Edge caching consistency to prevent cache busting attacks.
 */
export function normalizeRankingQuery(searchParams: URLSearchParams): string {
  const page = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || 'score';
  const reg = searchParams.get('reg') || 'all';

  const normalized = new URLSearchParams();
  normalized.set('page', page);
  normalized.set('reg', reg);
  normalized.set('sort', sort);

  // Return sorted query string
  normalized.sort();
  return normalized.toString();
}
