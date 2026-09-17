import { verifyToken } from '../../../../src/utils/security';
import { createSessionCookie } from '../../../_lib/auth';
import type { PagesFunction } from '../../../types';

export const onRequestGet: PagesFunction = async (context) => {
  const secret = context.env.AUTH_SECRET || 'fallback-dev-secret-poke-tool';
  const clientId = context.env.X_CLIENT_ID;
  const clientSecret = context.env.X_CLIENT_SECRET;

  if (!clientId) {
    return new Response('X OAuth is not configured.', { status: 500 });
  }

  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Verify PKCE state from signed cookie
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const cookieMatch = cookieHeader.match(/poke_x_oauth=([^;]+)/);
  const signedPayload = cookieMatch ? cookieMatch[1] : null;

  if (!code || !state || !signedPayload) {
    return new Response('Invalid OAuth state or code.', { status: 400 });
  }

  const verifiedPayload = await verifyToken(signedPayload, secret);
  if (!verifiedPayload) {
    return new Response('Tampered OAuth state.', { status: 400 });
  }

  const [savedState, codeVerifier] = verifiedPayload.split(':');
  if (savedState !== state || !codeVerifier) {
    return new Response('Mismatched OAuth state.', { status: 400 });
  }

  // Exchange code for token
  const redirectUri = `${url.origin}/api/auth/callback/x`;
  const tokenParams = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const authHeader = clientSecret
    ? `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    : undefined;

  const tokenHeaders: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (authHeader) tokenHeaders.Authorization = authHeader;

  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: tokenHeaders,
    body: tokenParams,
  });

  if (!tokenRes.ok) {
    return new Response('Failed to exchange X token.', { status: 400 });
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Fetch X user profile
  const userRes = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!userRes.ok) {
    return new Response('Failed to fetch X user profile.', { status: 400 });
  }

  const xData = await userRes.json();
  const xProfile = xData.data;
  const xId = xProfile.id;
  const name = xProfile.name || xProfile.username || 'Trainer';
  const avatarUrl = xProfile.profile_image_url || null;
  const now = Math.floor(Date.now() / 1000);

  // Database UPSERT into D1
  const db = context.env.DB;
  let userId = `usr_${crypto.randomUUID()}`;

  const existingUser = await db
    .prepare(
      'SELECT id FROM users WHERE auth_provider = ? AND auth_provider_id = ?'
    )
    .bind('x', xId)
    .first<{ id: string }>();

  if (existingUser) {
    userId = existingUser.id;
    await db
      .prepare(
        'UPDATE users SET name = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
      )
      .bind(name, avatarUrl, now, userId)
      .run();
  } else {
    await db
      .prepare(
        'INSERT INTO users (id, name, email, avatar_url, auth_provider, auth_provider_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(userId, name, null, avatarUrl, 'x', xId, now, now)
      .run();
  }

  // Create session cookie
  const sessionUser = {
    id: userId,
    name,
    avatarUrl: avatarUrl || undefined,
    authProvider: 'x' as const,
  };
  const sessionCookie = await createSessionCookie(sessionUser, secret);

  // Clear PKCE cookie & redirect to party page
  const clearCookie =
    'poke_x_oauth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure';

  const responseHeaders = new Headers();
  responseHeaders.set('Location', '/party.html');
  responseHeaders.append('Set-Cookie', sessionCookie);
  responseHeaders.append('Set-Cookie', clearCookie);

  return new Response(null, {
    status: 302,
    headers: responseHeaders,
  });
};
