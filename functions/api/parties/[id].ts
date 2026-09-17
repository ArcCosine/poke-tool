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
    return new Response('Invalid article URL (must be https://)', {
      status: 400,
    });
  }

  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  // BOLA (Broken Object Level Authorization) Protection:
  // INSERT if new, or UPDATE only if parties.user_id matches excluded.user_id
  const result = await db
    .prepare(
      `INSERT INTO parties (
        id, user_id, title, regulation, party_data, rental_code, article_url, description, author_name, is_public, likes_count, ranking_score, views_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        regulation = excluded.regulation,
        party_data = excluded.party_data,
        rental_code = excluded.rental_code,
        article_url = excluded.article_url,
        description = excluded.description,
        author_name = excluded.author_name,
        is_public = excluded.is_public,
        updated_at = excluded.updated_at
      WHERE parties.user_id = excluded.user_id`
    )
    .bind(
      partyId,
      user.id,
      party.title,
      party.regulation || 'all',
      party.party_data,
      party.rental_code || null,
      party.article_url || null,
      party.description || null,
      party.author_name || null,
      party.is_public ? 1 : 0,
      now,
      now
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
