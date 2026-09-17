import type { PagesFunction } from './types';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // Serve Google Search Console verification files with direct 200 OK (prevent 308 redirect)
  if (/^\/google[a-zA-Z0-9]+\.html$/.test(url.pathname)) {
    const cleanPath = url.pathname.replace(/\.html$/, '');
    const assetUrl = new URL(cleanPath, url.origin);
    const assetResponse = await context.env.ASSETS.fetch(
      new Request(assetUrl.toString(), context.request)
    );
    if (assetResponse.ok) {
      return new Response(assetResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      });
    }
  }

  return context.next();
};
