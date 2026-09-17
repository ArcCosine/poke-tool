import { isValidArticleUrl } from '../../../src/utils/security';
import { parseSessionCookie, verifySessionToken } from '../../_lib/auth';
import type { PagesFunction } from '../../types';

export const onRequestPut: PagesFunction = async (context) => {
  const secret = context.env.AUTH_SECRET || 'fallback-dev-secret-poke-tool';
  const cookieHeader = context.request.headers.get('Cookie');
  const token = parseSessionCookie(cookieHeader);

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await verifySessionToken(token, secret);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const partyId = context.params.id as string;
  if (!partyId) {
    return new Response('Missing party ID', { status: 400 });
  }

  const body = (await context.request.json()) as any;
  const party = body.party;
  if (!party || !party.title || !party.party_data) {
    return new Response('Invalid payload', { status: 400 });
  }

  if (party.article_url && !isValidArticleUrl(party.article_url)) {
    return new Response('Invalid article URL (must be https://)', { status: 400 });
  }

  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  // BOLA (Broken Object Level Authorization) Protection:
  // Must match both `id = ?` AND `user_id = ?`
  const result = await db
    .prepare(
      `UPDATE parties SET
        title = ?,
        regulation = ?,
        party_data = ?,
        rental_code = ?,
        article_url = ?,
        description = ?,
        is_public = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?`
    )
    .bind(
      party.title,
      party.regulation || 'all',
      party.party_data,
      party.rental_code || null,
      party.article_url || null,
      party.description || null,
      party.is_public ? 1 : 0,
      now,
      partyId,
      user.id
    )
    .run();

  if (result.meta.changes === 0) {
    return new Response(
      'Party not found or you do not have permission to modify it.',
      { status: 403 }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestDelete: PagesFunction = async (context) => {
  const secret = context.env.AUTH_SECRET || 'fallback-dev-secret-poke-tool';
  const cookieHeader = context.request.headers.get('Cookie');
  const token = parseSessionCookie(cookieHeader);

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await verifySessionToken(token, secret);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const partyId = context.params.id as string;
  if (!partyId) {
    return new Response('Missing party ID', { status: 400 });
  }

  const db = context.env.DB;

  // BOLA Protection:
  // Must match both `id = ?` AND `user_id = ?`
  const result = await db
    .prepare('DELETE FROM parties WHERE id = ? AND user_id = ?')
    .bind(partyId, user.id)
    .run();

  if (result.meta.changes === 0) {
    return new Response(
      'Party not found or you do not have permission to delete it.',
      { status: 403 }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
