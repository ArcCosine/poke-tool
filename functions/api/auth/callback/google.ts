import { verifyToken } from '../../../../src/utils/security';
import { createSessionCookie, fromBase64Url } from '../../../_lib/auth';
import type { PagesFunction } from '../../../types';

export const onRequestGet: PagesFunction = async (context) => {
  const secret = context.env.AUTH_SECRET || 'fallback-dev-secret-poke-tool';
  const clientId = context.env.GOOGLE_CLIENT_ID;
  const clientSecret = context.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('Google OAuth is not configured.', { status: 500 });
  }

  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Verify CSRF state
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const cookieMatch = cookieHeader.match(/poke_oauth_state=([^;]+)/);
  const cookieState = cookieMatch ? cookieMatch[1] : null;

  if (!code || !state || !cookieState || state !== cookieState) {
    return new Response('Invalid OAuth state or code.', { status: 400 });
  }

  const verifiedState = await verifyToken(state, secret);
  if (!verifiedState) {
    return new Response('Tampered OAuth state.', { status: 400 });
  }

  // Exchange code for tokens
  const redirectUri = `${url.origin}/api/auth/callback/google`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return new Response('Failed to exchange Google token.', { status: 400 });
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Get user profile
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    return new Response('Failed to fetch user profile.', { status: 400 });
  }

  const profile = await userRes.json();
  const googleId = profile.id;
  const name = profile.name || profile.email || 'Trainer';
  const email = profile.email || null;
  const avatarUrl = profile.picture || null;
  const now = Math.floor(Date.now() / 1000);

  // Database UPSERT into D1
  const db = context.env.DB;
  let userId = `usr_${crypto.randomUUID()}`;

  // Check if user already exists
  const existingUser = await db
    .prepare(
      'SELECT id FROM users WHERE auth_provider = ? AND auth_provider_id = ?'
    )
    .bind('google', googleId)
    .first<{ id: string }>();

  if (existingUser) {
    userId = existingUser.id;
    await db
      .prepare(
        'UPDATE users SET name = ?, email = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
      )
      .bind(name, email, avatarUrl, now, userId)
      .run();
  } else {
    await db
      .prepare(
        'INSERT INTO users (id, name, email, avatar_url, auth_provider, auth_provider_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(userId, name, email, avatarUrl, 'google', googleId, now, now)
      .run();
  }

  // Create session cookie
  const sessionUser = {
    id: userId,
    name,
    avatarUrl: avatarUrl || undefined,
    authProvider: 'google' as const,
  };
  const sessionCookie = await createSessionCookie(sessionUser, secret);

  // Parse redirectTo from verified state safely
  let redirectTo = '/party-ranking.html';
  try {
    let json: string;
    try {
      json = fromBase64Url(verifiedState);
    } catch {
      json = verifiedState;
    }
    const parsedState = JSON.parse(json);
    if (
      parsedState &&
      typeof parsedState.redirectTo === 'string' &&
      parsedState.redirectTo.startsWith('/') &&
      !parsedState.redirectTo.startsWith('//') &&
      !parsedState.redirectTo.includes('\\')
    ) {
      redirectTo = parsedState.redirectTo;
    }
  } catch {
    // Keep fallback default
  }

  // Clear state cookie & redirect to target page
  const clearStateCookie =
    'poke_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure';

  const responseHeaders = new Headers();
  responseHeaders.set('Location', redirectTo);
  responseHeaders.append('Set-Cookie', sessionCookie);
  responseHeaders.append('Set-Cookie', clearStateCookie);

  return new Response(null, {
    status: 302,
    headers: responseHeaders,
  });
};
