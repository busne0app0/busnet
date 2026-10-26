import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');
  // '/' on Vercel (standalone domain), '/driver/' on local dev gateway
  const base = process.env.VITE_DRIVER_BASE || (process.env.VERCEL || process.env.STANDALONE === 'true' ? '/' : '/driver/');

  return {
    envDir: path.resolve(__dirname, '../../'),
    resolve: { alias: { '@busnet/shared': path.resolve(__dirname, '../../packages/shared/src') } },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        workbox: {
          maximumFileSizeToCacheInBytes: 3000000
        },
        manifest: {
          name: 'Busnet Driver',
          short_name: 'Driver',
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
      port: 3004,
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      fs: {
        allow: ['../..']
      }
    }
  };
});
