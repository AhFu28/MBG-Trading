export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const target = `https://www.tokocrypto.com${url.pathname.replace(/^\/api\/tokocrypto/, '')}${url.search}`;
  const upstream = await fetch(target, {
    headers: { 'User-Agent': 'MBG-Trading-Cockpit/2.0' }
  });
  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=5, s-maxage=10'
    }
  });
}
