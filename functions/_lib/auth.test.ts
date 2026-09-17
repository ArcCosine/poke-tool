import { describe, expect, it } from 'vitest';
import {
  createSessionCookie,
  fromBase64Url,
  parseSessionCookie,
  toBase64Url,
  verifySessionToken,
} from './auth';

describe('Backend Auth & Session Helpers', () => {
  const SECRET = 'pages-functions-jwt-secret-key-1234567890';

  it('should create and verify session cookie', async () => {
    const user = {
      id: 'usr_test_999',
      name: 'サトシ',
      authProvider: 'google' as const,
    };

    const cookieString = await createSessionCookie(user, SECRET);
    expect(cookieString).toContain('poke_session=');
    expect(cookieString).toContain('HttpOnly');
    expect(cookieString).toContain('SameSite=Lax');

    const token = parseSessionCookie(cookieString);
    expect(token).toBeDefined();

    const verifiedUser = await verifySessionToken(token!, SECRET);
    expect(verifiedUser).toEqual(user);
  });

  it('should reject tampered session token', async () => {
    const user = {
      id: 'usr_test_999',
      name: 'サトシ',
      authProvider: 'google' as const,
    };

    const cookieString = await createSessionCookie(user, SECRET);
    const token = parseSessionCookie(cookieString)!;
    const tamperedToken = `${token}tampered`;

    const verified = await verifySessionToken(tamperedToken, SECRET);
    expect(verified).toBeNull();
  });

  it('should produce RFC 6265 compliant cookie values without quotes, commas, or braces', async () => {
    const user = {
      id: 'usr_test_complex_123',
      name: 'レッド & グリーン, "最強" のトレーナー',
      avatarUrl: 'https://example.com/avatar?size=100&format=png,jpg',
      authProvider: 'google' as const,
    };

    const cookieString = await createSessionCookie(user, SECRET);
    const token = parseSessionCookie(cookieString)!;

    // Cookie value must NOT contain illegal RFC 6265 characters: " , ; { } \ or whitespace
    expect(token).not.toMatch(/[\s",;{}\\]/);
    // Token should match Base64URL and hex signature pattern: [base64url].[hex]
    expect(token).toMatch(/^[A-Za-z0-9\-_]+\.[0-9a-f]+$/);

    const verifiedUser = await verifySessionToken(token, SECRET);
    expect(verifiedUser).toEqual(user);
  });

  it('should safely return null for invalid or corrupted base64 payloads', async () => {
    const corruptedToken = 'invalid-not-base64-payload.1234567890abcdef';
    const result = await verifySessionToken(corruptedToken, SECRET);
    expect(result).toBeNull();
  });

  it('should correctly roundtrip UTF-8 strings in toBase64Url and fromBase64Url', () => {
    const raw = JSON.stringify({
      name: 'ピカチュウ ⚡ & ゲンガー',
      quote: '"Ready?"',
      path: '/party-ranking.html?reg=h#top',
    });

    const encoded = toBase64Url(raw);
    expect(encoded).not.toMatch(/[+/=]/); // No standard base64 +, /, or = padding
    const decoded = fromBase64Url(encoded);
    expect(decoded).toEqual(raw);
  });
});
