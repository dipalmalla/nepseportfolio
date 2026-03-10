// api/prices.js — Vercel Serverless Function
// Proxies MeroLagani live market data server-side, bypassing CORS entirely.
// Deploy: push to GitHub → Vercel auto-deploys → available at /api/prices

export default async function handler(req, res) {
  // Allow your Vercel frontend to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = 'https://merolagani.com/handlers/webrequesthandler.ashx?type=live_market';

    const response = await fetch(url, {
      headers: {
        // Mimic a real browser request so MeroLagani doesn't block us
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://merolagani.com/LatestMarket.aspx',
        'Accept': 'application/json, text/javascript, */*',
      },
      // Abort if MeroLagani takes too long (Vercel functions have a 10s limit on hobby plan)
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `MeroLagani returned ${response.status}` });
    }

    const data = await response.json();

    // Cache for 15 seconds on Vercel's CDN edge — reduces hammering MeroLagani
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json(data);

  } catch (err) {
    console.error('prices.js error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
