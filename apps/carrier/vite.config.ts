import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env from monorepo root (../../)
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');
  // '/' on Vercel (standalone domain), '/carrier/' on local dev gateway
  const base = process.env.VITE_CARRIER_BASE || (process.env.VERCEL || process.env.STANDALONE === 'true' ? '/' : '/carrier/');

  return {
  envDir: path.resolve(__dirname, '../../'),
  resolve: { alias: { '@busnet/shared': path.resolve(__dirname, '../../packages/shared/src') } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        maximumFileSizeToCacheInBytes: 3000000,
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: 'BUSNET CRM',
        short_name: 'CRM',
        theme_color: '#030712',
        background_color: '#030712',
        display: 'standalone',
        scope: base,
        start_url: base,
        icons: [
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
    base,
    server: {
      port: 3001,
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      fs: {
        allow: ['../..']
      }
    }
  };
});
