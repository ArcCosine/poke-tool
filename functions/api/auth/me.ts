import { parseSessionCookie, verifySessionToken } from '../../_lib/auth';
import type { PagesFunction } from '../../types';

export const onRequestGet: PagesFunction = async (context) => {
  const secret = context.env.AUTH_SECRET || 'fallback-dev-secret-poke-tool';
  const cookieHeader = context.request.headers.get('Cookie');
  const token = parseSessionCookie(cookieHeader);

  if (!token) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await verifySessionToken(token, secret);
  return new Response(JSON.stringify({ user }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
