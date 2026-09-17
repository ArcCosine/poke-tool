import type { PagesFunction } from '../../types';

export const onRequestPost: PagesFunction = async () => {
  const expiredCookie =
    'poke_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure';

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': expiredCookie,
    },
  });
};
