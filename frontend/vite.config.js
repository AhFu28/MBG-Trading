import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Dev-only middleware that serves the engine's cached bundle from OUTSIDE
 * public/, so VIP signal payloads are never emitted as a downloadable static
 * file in the production build.
 *
 * The engine still writes to frontend/public/data (its existing output path),
 * but nothing under public/ is fetched by the app at runtime any more.
 */
function devBundlePlugin() {
  return {
    name: 'mbg-dev-bundle',
    apply: 'serve',
    configureServer(server) {
      const engineCache = path.resolve(__dirname, '..', 'engine', 'cache');
      const publicData = path.resolve(__dirname, 'public', 'data');
      const eaPath = path.resolve(__dirname, '..', 'engine', 'mt5', 'MBG_Institutional_Apex_EA.mq5');

      const readJson = (candidates) => {
        const found = candidates.find(p => fs.existsSync(p));
        return found ? fs.readFileSync(found, 'utf-8') : null;
      };

      const send = (res, body, type = 'application/json', status = 200) => {
        res.statusCode = status;
        res.setHeader('Content-Type', type);
        res.setHeader('Cache-Control', 'no-store');
        res.end(body);
      };

      server.middlewares.use('/api/dev-bundle', (req, res) => {
        const reqUrl = new URL(req.url, 'http://localhost');

        // EA source code — paid deliverable, never a static public file.
        if (reqUrl.searchParams.get('type') === 'ea') {
          if (!fs.existsSync(eaPath)) return send(res, `// EA source missing at ${eaPath}`, 'text/plain', 404);
          return send(res, fs.readFileSync(eaPath), 'text/plain; charset=utf-8');
        }

        const raw = readJson([
          path.join(engineCache, 'latest_cockpit_bundle.json'),
          path.join(__dirname, 'src', 'data', 'dev_bundle.json'),
          path.join(publicData, 'latest_cockpit_bundle.json'),
        ]);
        if (!raw) {
          return send(res, JSON.stringify({ error: 'no local bundle available' }), 'application/json', 404);
        }
        return send(res, raw);
      });

      // Dev-only auth stub: production auth is functions/api/auth.js (Cloudflare);
      // local dev has no functions, so auto-pass the gate to render the cockpit.
      server.middlewares.use('/api/auth', (req, res) => {
        send(res, JSON.stringify({ authenticated: true, tier: 'PRO' }));
      });

      // Dev-only live RSS news feed proxy
      server.middlewares.use('/api/news', async (req, res) => {
        try {
          const reqUrl = new URL(req.url, 'http://localhost');
          const category = (reqUrl.searchParams.get('category') || 'ALL').toUpperCase();
          let query = 'IHSG+OR+saham+Indonesia+OR+kripto+OR+bitcoin';
          if (category === 'IDX') query = 'IHSG+OR+"saham+Indonesia"+OR+"Bursa+Efek+Indonesia"+OR+BBCA+OR+BBRI';
          else if (category === 'CRYPTO') query = 'bitcoin+OR+crypto+OR+ethereum+OR+kripto+OR+altcoin';
          else if (category === 'MACRO') query = '"Bank+Indonesia"+OR+"Federal+Reserve"+OR+inflasi+OR+rupiah';

          const rssUrl = `https://news.google.com/rss/search?q=${query}+when:1d&hl=id&gl=ID&ceid=ID:id`;
          const resp = await fetch(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          if (resp.ok) {
            const xml = await resp.text();
            const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
            const articles = [];
            for (let i = 0; i < Math.min(itemMatches.length, 35); i++) {
              const itemXml = itemMatches[i];
              const rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
              const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
              const pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
              let sourceName = (itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';
              let title = rawTitle.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/<[^>]*>/g, '').trim();
              if (!sourceName && title.includes(' - ')) {
                const parts = title.split(' - ');
                sourceName = parts.pop().trim();
                title = parts.join(' - ').trim();
              }
              const dt = new Date(pubDate);
              const ts = isNaN(dt.getTime()) ? Date.now() : dt.getTime();
              const wib = new Date(ts + 7 * 3600 * 1000);
              const day = String(wib.getUTCDate()).padStart(2, '0');
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
              const dateStr = `${day} ${months[wib.getUTCMonth()]} ${wib.getUTCFullYear()}`;
              const timeStr = `${String(wib.getUTCHours()).padStart(2, '0')}:${String(wib.getUTCMinutes()).padStart(2, '0')} WIB`;
              articles.push({
                id: `dev-live-rss-${ts}-${i}`,
                title: title,
                source: sourceName || 'Warta Pasar',
                link: link,
                pub_date: dt.toUTCString(),
                timestamp_ms: ts,
                published_str: `${dateStr} • ${timeStr}`,
                published_date: dateStr,
                published_time: timeStr,
                sentiment: 'NEUTRAL',
                sentiment_score: 0.0,
                related_tickers: ['IHSG'],
                primary_ticker: 'IHSG',
                summary: title
              });
            }
            return send(res, JSON.stringify({ status: 'ok', articles, total: articles.length }));
          }
        } catch (e) {
          // fallback to empty
        }
        send(res, JSON.stringify({ status: 'ok', articles: [] }));
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devBundlePlugin()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/tokocrypto': {
        target: 'https://www.tokocrypto.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tokocrypto/, '')
      },
      '/api/indodax': {
        target: 'https://indodax.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/indodax/, '')
      },
      '/api/pumpfun': {
        target: 'https://frontend-api-v3.pump.fun',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pumpfun/, '')
      }
    }
  }
})
