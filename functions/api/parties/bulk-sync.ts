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

  const validParties = parties
    .slice(0, 50)
    .filter((p: any) => p && p.id && p.title && p.party_data);

  if (validParties.length === 0) {
    return new Response(
      JSON.stringify({ success: true, count: 0, remappedIds: {} }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check existing parties to detect collisions with other users
  const placeholders = validParties.map(() => '?').join(',');
  const ids = validParties.map((p: any) => p.id);
  const { results: existingRows } = await db
    .prepare(`SELECT id, user_id FROM parties WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<{ id: string; user_id: string }>();

  const existingMap = new Map<string, string>();
  if (Array.isArray(existingRows)) {
    for (const row of existingRows) {
      existingMap.set(row.id, row.user_id);
    }
  }

  const remappedIds: Record<string, string> = {};
  const stmts = [];

  for (const party of validParties) {
    let partyId = party.id;
    const existingUserId = existingMap.get(partyId);

    // If ID is already owned by another user, remap to a new UUID to prevent collision and allow import
    if (existingUserId && existingUserId !== user.id) {
      partyId = `pty_${crypto.randomUUID()}`;
      remappedIds[party.id] = partyId;
    }

    const validUrl =
      party.article_url && isValidArticleUrl(party.article_url)
        ? party.article_url
        : null;

    stmts.push(
      db
        .prepare(
          `INSERT INTO parties (
            id, user_id, title, regulation, party_data, rental_code, article_url, description, author_name, is_public, likes_count, ranking_score, views_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, 0, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
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
          validUrl,
          party.description || null,
          party.author_name || null,
          party.is_public ? 1 : 0,
          now,
          party.updated_at || now
        )
    );
  }

  if (stmts.length > 0) {
    await db.batch(stmts);
  }

  return new Response(
    JSON.stringify({ success: true, count: stmts.length, remappedIds }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
