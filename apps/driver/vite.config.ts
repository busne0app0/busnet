import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  envDir: path.resolve(__dirname, '../../'),
  resolve: { alias: { '@busnet/shared': path.resolve(__dirname, '../../packages/shared/src') } },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
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
        scope: '/driver/',
        start_url: '/driver/',
        icons: [
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  base: '/driver/',
  server: { 
    hmr: process.env.DISABLE_HMR !== 'true',
    fs: {
      allow: ['../..']
    }
  }
});
