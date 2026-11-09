import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Парсинг JSON для API запросов
  app.use(express.json());

  // Add health check for Google Cloud Load Balancer
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Whitelist дозволених ендпоінтів для шлюзу Al-Trans
  const ALLOWED_ALTRANS_ENDPOINTS = [
    '/api/v2/booking/search_trips',
    '/api/v3/booking/get_bus_map_for_trip_id',
    '/api/v3/cache/routes'
  ];

  // ✅ ЖИВОЙ ШЛЮЗ ДЛЯ AL-TRANS API (БЕЗ CORS И БЕЗ БЛОКИРОВОК)
  app.all('/api/altrans/*', async (req, res) => {
    try {
      const targetPath = req.originalUrl.replace(/^\/api\/altrans/, '').split('?')[0];
      const isAllowed = ALLOWED_ALTRANS_ENDPOINTS.some(ep => targetPath.startsWith(ep));
      if (!isAllowed) {
        return res.status(403).json({ error: 'Заборонений ендпоінт політикою безпеки BUSNET' });
      }

      const fullTargetPath = req.originalUrl.replace(/^\/api\/altrans/, '');
      const targetUrl = `https://al-trans.com.ua${fullTargetPath}`;

      console.log(`[Busnet-Gateway] Proxying (${req.method}) to Al-Trans: ${targetUrl}`);

      const altransKey = process.env.ALTRANS_API_KEY;
      if (!altransKey) {
        console.warn('[Busnet-Gateway] Warning: ALTRANS_API_KEY not configured in environment.');
      }

      const headers: Record<string, string> = {
        'Accept-Language': 'uk',
      };
      if (altransKey) {
        headers['Api-Key'] = altransKey;
      }
      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'] as string;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error('[Busnet-Gateway] Al-Trans proxy error:', error);
      return res.status(500).json({ error: 'Al-Trans proxy connection failed' });
    }
  });

  // Redirect sub-apps without trailing slash → with trailing slash (302 = not cached)
  ['carrier', 'admin', 'agent', 'driver'].forEach(name => {
    app.get(`/${name}`, (req, res, next) => {
      const cleanPath = req.originalUrl.split('?')[0];
      if (cleanPath === `/${name}`) {
        const query = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
        return res.redirect(302, `/${name}/${query}`);
      }
      next();
    });
  });

  // Apps configuration - ORDER MATTERS! landing ('/') must be last.
  const viteApps = [
    { name: 'carrier', route: '/carrier', dir: 'carrier' },
    { name: 'admin', route: '/admin', dir: 'admin' },
    { name: 'agent', route: '/agent', dir: 'agent' },
    { name: 'driver', route: '/driver', dir: 'driver' },
    { name: 'landing', route: '/', dir: 'landing' },
  ];

  const DEV_APP = process.env.DEV_APP || 'landing';

  console.log(`✅ [Busnet-OS] Trick Gateway Mode Active!`);
  console.log(`🚀 Live HMR is ENABLED for: [${DEV_APP.toUpperCase()}]`);

  for (const va of viteApps) {
    const distPath = path.resolve(process.cwd(), 'apps', va.dir, 'dist');
    const useDev = (va.name === DEV_APP || !fs.existsSync(distPath)) && process.env.NODE_ENV !== 'production';

    if (useDev) {
      const hmrPort = 24678 + viteApps.indexOf(va);
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR !== 'true' ? { port: hmrPort } : false
        },
        appType: 'spa',
        root: path.resolve(process.cwd(), 'apps', va.dir),
      });
      console.log(`🚀 [Gateway] Mounting LIVE DEV ${va.name} app at ${va.route}`);
      app.use(va.route, vite.middlewares);
      app.use(va.route, async (req, res, next) => {
        if (req.method !== 'GET' || req.path.includes('.')) return next();
        try {
          const indexPath = path.resolve(process.cwd(), 'apps', va.dir, 'index.html');
          if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');
            html = await vite.transformIndexHtml(req.originalUrl, html);
            res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
            return;
          }
        } catch (e) {
          return next(e);
        }
        next();
      });
    } else if (fs.existsSync(distPath)) {
      console.log(`⚡ [Static Prod] ${va.name} @ ${va.route}`);
      app.use(va.route === '/' ? '/' : va.route, express.static(distPath, { setHeaders: (res, filePath) => { if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));

      app.get([va.route, `${va.route}/*`], (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.log(`⚠️  [Missing] ${va.name} is missing dist/. Ready to be built.`);
      if (va.name !== 'landing') {
        app.get([va.route, `${va.route}/*`], (req, res) => {
          res.status(503).send(`<h1>Додаток ${va.name} ще не зібрано!</h1>`);
        });
      }
    }
  }

  app.use('*', (req, res) => {
    res.status(404).send(`<h1>BUSNET VFS Fallback 404</h1><p>Path ${req.path} was not matched by any TurboRepo gateway rules.</p><a href="/">Go back to Landing</a>`);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ [Busnet-OS] Core API & Multi-Vite Server running on port ${PORT}`);
  });
}

startServer();