import { signToken } from '../../../src/utils/security';
import type { PagesFunction } from '../../types';

export const onRequestGet: PagesFunction = async (context) => {
  const clientId = context.env.X_CLIENT_ID;
  const secret = context.env.AUTH_SECRET || 'fallback-dev-secret-poke-tool';

  if (!clientId) {
    return new Response('X OAuth is not configured.', { status: 500 });
  }

  const url = new URL(context.request.url);
  const redirectUri = `${url.origin}/api/auth/callback/x`;

  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID() + crypto.randomUUID(); // PKCE code_verifier
  const signedState = await signToken(`${state}:${codeVerifier}`, secret);

  const xAuthUrl = new URL('https://twitter.com/i/oauth2/authorize');
  xAuthUrl.searchParams.set('response_type', 'code');
  xAuthUrl.searchParams.set('client_id', clientId);
  xAuthUrl.searchParams.set('redirect_uri', redirectUri);
  xAuthUrl.searchParams.set('scope', 'tweet.read users.read');
  xAuthUrl.searchParams.set('state', state);
  xAuthUrl.searchParams.set('code_challenge', codeVerifier);
  xAuthUrl.searchParams.set('code_challenge_method', 'plain');

  return new Response(null, {
    status: 302,
    headers: {
      Location: xAuthUrl.toString(),
      'Set-Cookie': `poke_x_oauth=${signedState}; Path=/; Max-Age=300; HttpOnly; SameSite=Lax; Secure`,
    },
  });
};
