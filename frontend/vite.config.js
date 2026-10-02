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
      }
    }
  }
})
