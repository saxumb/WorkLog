import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          manifest: {
            name: 'WorkLog AI',
            short_name: 'WorkLog',
            description: 'Professional timesheet application with AI-powered reporting',
            theme_color: '#4f46e5',
            background_color: '#f8fafc',
            display: 'standalone',
            icons: [
              {
                src: 'https://picsum.photos/192/192',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'https://picsum.photos/512/512',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
