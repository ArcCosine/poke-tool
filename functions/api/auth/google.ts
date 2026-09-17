import { signToken } from '../../../src/utils/security';
import type { PagesFunction } from '../../types';

export const onRequestGet: PagesFunction = async (context) => {
  const clientId = context.env.GOOGLE_CLIENT_ID;
  const secret = context.env.AUTH_SECRET || 'fallback-dev-secret-poke-tool';

  if (!clientId) {
    return new Response('Google OAuth is not configured.', { status: 500 });
  }

  const url = new URL(context.request.url);
  const redirectUri = `${url.origin}/api/auth/callback/google`;
  const state = crypto.randomUUID();
  const signedState = await signToken(state, secret);

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', signedState);
  googleAuthUrl.searchParams.set('access_type', 'online');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return new Response(null, {
    status: 302,
    headers: {
      Location: googleAuthUrl.toString(),
      'Set-Cookie': `poke_oauth_state=${signedState}; Path=/; Max-Age=300; HttpOnly; SameSite=Lax; Secure`,
    },
  });
};
