import type { PagesFunction } from '../types';

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const sort = url.searchParams.get('sort') || 'score';
  const reg = url.searchParams.get('reg') || 'all';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const db = context.env.DB;

  let query = `
    SELECT
      parties.id,
      parties.user_id,
      parties.title,
      parties.regulation,
      parties.party_data,
      parties.rental_code,
      parties.article_url,
      parties.description,
      parties.author_name,
      parties.likes_count,
      parties.ranking_score,
      parties.views_count,
      parties.created_at,
      parties.updated_at
    FROM parties
    WHERE parties.is_public = 1
  `;

  const params: any[] = [];
  if (reg !== 'all') {
    query += ' AND parties.regulation = ?';
    params.push(reg);
  }

  if (sort === 'newest') {
    query += ' ORDER BY parties.created_at DESC LIMIT ? OFFSET ?';
  } else {
    query +=
      ' ORDER BY parties.ranking_score DESC, parties.likes_count DESC, parties.created_at DESC LIMIT ? OFFSET ?';
  }
  params.push(limit, offset);

  const { results } = await db
    .prepare(query)
    .bind(...params)
    .all();

  return new Response(JSON.stringify({ parties: results || [], page, limit }), {
    headers: {
      'Content-Type': 'application/json',
      // Cache at Cloudflare Edge for 60s to protect D1 query quotas from DDoS / cache-busting
      'Cache-Control': 'public, max-age=30, s-maxage=60',
    },
  });
};
