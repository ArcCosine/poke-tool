import { isValidArticleUrl } from '../../../src/utils/security';
import { parseSessionCookie, verifySessionToken } from '../../_lib/auth';
import type { PagesFunction } from '../../types';

export const onRequestPost: PagesFunction = async (context) => {
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

  const body = (await context.request.json()) as any;
  const parties = body.parties;
  if (!Array.isArray(parties)) {
    return new Response('Invalid payload', { status: 400 });
  }

  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  const stmts = [];
  for (const party of parties.slice(0, 50)) {
    if (!party.id || !party.title || !party.party_data) continue;

    const validUrl =
      party.article_url && isValidArticleUrl(party.article_url)
        ? party.article_url
        : null;

    stmts.push(
      db
        .prepare(
          `INSERT INTO parties (
            id, user_id, title, regulation, party_data, rental_code, article_url, description, is_public, likes_count, ranking_score, views_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, 0, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            party_data = excluded.party_data,
            rental_code = excluded.rental_code,
            article_url = excluded.article_url,
            description = excluded.description,
            is_public = excluded.is_public,
            updated_at = excluded.updated_at
          WHERE parties.user_id = excluded.user_id`
        )
        .bind(
          party.id,
          user.id,
          party.title,
          party.regulation || 'all',
          party.party_data,
          party.rental_code || null,
          validUrl,
          party.description || null,
          party.is_public ? 1 : 0,
          now,
          party.updated_at || now
        )
    );
  }

  if (stmts.length > 0) {
    await db.batch(stmts);
  }

  return new Response(JSON.stringify({ success: true, count: stmts.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
