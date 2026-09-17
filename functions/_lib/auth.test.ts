import { describe, expect, it } from 'vitest';
import {
  createSessionCookie,
  parseSessionCookie,
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
});
