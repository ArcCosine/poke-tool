import { isValidArticleUrl } from '../../../src/utils/security';
import { parseSessionCookie, verifySessionToken } from '../../_lib/auth';
import type { PagesFunction } from '../../types';

export const onRequestGet: PagesFunction = async (context) => {
  const secret = context.env.AUTH_SECRET || 'fallback-dev-secret-poke-tool';
  const cookieHeader = context.request.headers.get('Cookie');
  const token = parseSessionCookie(cookieHeader);

  if (!token) {
    return new Response(JSON.stringify({ parties: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await verifySessionToken(token, secret);
  if (!user) {
    return new Response(JSON.stringify({ parties: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = context.env.DB;
  const { results } = await db
    .prepare('SELECT * FROM parties WHERE user_id = ? ORDER BY updated_at DESC')
    .bind(user.id)
    .all();

  return new Response(JSON.stringify({ parties: results || [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

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
  const party = body.party;
  if (!party || !party.id || !party.title || !party.party_data) {
    return new Response('Invalid party payload', { status: 400 });
  }

  if (party.article_url && !isValidArticleUrl(party.article_url)) {
    return new Response('Invalid article URL (must be https://)', { status: 400 });
  }

  const db = context.env.DB;

  // Max 50 parties per user protection
  const countRow = await db
    .prepare('SELECT COUNT(*) as count FROM parties WHERE user_id = ?')
    .bind(user.id)
    .first<{ count: number }>();

  if (countRow && countRow.count >= 50) {
    return new Response('Party limit reached (max 50).', { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO parties (
        id, user_id, title, regulation, party_data, rental_code, article_url, description, is_public, likes_count, ranking_score, views_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, 0, ?, ?)`
    )
    .bind(
      party.id,
      user.id,
      party.title,
      party.regulation || 'all',
      party.party_data,
      party.rental_code || null,
      party.article_url || null,
      party.description || null,
      party.is_public ? 1 : 0,
      now,
      now
    )
    .run();

  return new Response(JSON.stringify({ success: true, id: party.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
