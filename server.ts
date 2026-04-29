import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add health check for Google Cloud Load Balancer
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Apps configuration - ORDER MATTERS! landing ('/') must be last.
  const viteApps = [
    { name: 'carrier', route: '/carrier', dir: 'carrier' },
    { name: 'admin', route: '/admin', dir: 'admin' },
    { name: 'agent', route: '/agent', dir: 'agent' },
    { name: 'driver', route: '/driver', dir: 'driver' },
    { name: 'landing', route: '/', dir: 'landing' },
  ];

  // We define which app we are actively developing to hook up HMR.
  // The rest will be served as pre-built production static files to save 99% RAM!
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
    } else if (fs.existsSync(distPath)) {
      console.log(`⚡ [Static Prod] ${va.name} @ ${va.route}`);
      app.use(va.route === '/' ? '/' : va.route, express.static(distPath, { setHeaders: (res, path) => { if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));
      
      // This is the absolute fallback for any SPA routes to prevent 404
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

  // Final absolute catch-all fallback to prevent generic Google GFE 404
  app.use('*', (req, res) => {
    res.status(404).send(`<h1>BUSNET VFS Fallback 404</h1><p>Path ${req.path} was not matched by any TurboRepo gateway rules.</p><a href="/">Go back to Landing</a>`);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ [Busnet-OS] Core API & Multi-Vite Server running on port ${PORT}`);
  });
}

startServer();
