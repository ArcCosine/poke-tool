import { calculateRankingScore } from '../../../../src/utils/security';
import { parseSessionCookie, verifySessionToken } from '../../../_lib/auth';
import type { PagesFunction } from '../../../types';

export const onRequestPost: PagesFunction = async (context) => {
  const secret = context.env.AUTH_SECRET || 'fallback-dev-secret-poke-tool';
  const partyId = context.params.id as string;

  if (!partyId) {
    return new Response('Missing party ID', { status: 400 });
  }

  // 1. Identify user (Authenticated or Anonymous Device ID)
  const cookieHeader = context.request.headers.get('Cookie');
  const token = parseSessionCookie(cookieHeader);
  const user = token ? await verifySessionToken(token, secret) : null;

  let userIdentifier = '';
  if (user) {
    userIdentifier = `user:${user.id}`;
  } else {
    // Check for client-provided anonymous ID or header
    const clientHeader = context.request.headers.get('X-Client-Id');
    if (clientHeader && clientHeader.startsWith('anon:')) {
      userIdentifier = clientHeader;
    } else {
      userIdentifier = `anon:${crypto.randomUUID()}`;
    }
  }

  // 2. Cloudflare Turnstile Bot verification (if configured)
  const turnstileSecret = context.env.TURNSTILE_SECRET_KEY;
  let body: any = {};
  try {
    body = await context.request.json();
  } catch {
    // body might be empty
  }

  if (turnstileSecret && !user && body.turnstileToken) {
    const ip = context.request.headers.get('CF-Connecting-IP') || '';
    const turnstileFormData = new FormData();
    turnstileFormData.append('secret', turnstileSecret);
    turnstileFormData.append('response', body.turnstileToken);
    if (ip) turnstileFormData.append('remoteip', ip);

    const turnstileRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body: turnstileFormData }
    );
    const turnstileOutcome = await turnstileRes.json();
    if (!turnstileOutcome.success) {
      return new Response('Bot verification failed.', { status: 403 });
    }
  }

  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  // 3. Toggle Like in party_likes
  const existingLike = await db
    .prepare(
      'SELECT created_at FROM party_likes WHERE user_identifier = ? AND party_id = ?'
    )
    .bind(userIdentifier, partyId)
    .first();

  let isLiked = false;
  if (existingLike) {
    // Unlike
    await db
      .prepare(
        'DELETE FROM party_likes WHERE user_identifier = ? AND party_id = ?'
      )
      .bind(userIdentifier, partyId)
      .run();
    isLiked = false;
  } else {
    // Like
    await db
      .prepare(
        'INSERT INTO party_likes (user_identifier, party_id, created_at) VALUES (?, ?, ?)'
      )
      .bind(userIdentifier, partyId, now)
      .run();
    isLiked = true;
  }

  // 4. Recalculate likes count and weighted score
  const counts = await db
    .prepare(
      `SELECT
        COUNT(CASE WHEN user_identifier LIKE 'user:%' THEN 1 END) as auth_count,
        COUNT(CASE WHEN user_identifier LIKE 'anon:%' THEN 1 END) as anon_count
      FROM party_likes WHERE party_id = ?`
    )
    .bind(partyId)
    .first<{ auth_count: number; anon_count: number }>();

  const authCount = counts?.auth_count ?? 0;
  const anonCount = counts?.anon_count ?? 0;
  const totalLikes = authCount + anonCount;
  const score = calculateRankingScore(authCount, anonCount);

  await db
    .prepare(
      'UPDATE parties SET likes_count = ?, ranking_score = ? WHERE id = ?'
    )
    .bind(totalLikes, score, partyId)
    .run();

  return new Response(
    JSON.stringify({
      success: true,
      liked: isLiked,
      likesCount: totalLikes,
      rankingScore: score,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
