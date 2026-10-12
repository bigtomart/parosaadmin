import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import express from 'express';
import { defineConfig, Plugin } from 'vite';
import { apiRouter } from './src/server/apiRouter';
import { runMigrations } from './src/db/migrate';
import { seedDatabase } from './src/db/seed';

function apiPlugin(): Plugin {
  const app = express();
  app.use(express.json());
  app.use(apiRouter);

  return {
    name: 'api-server-middleware',
    configureServer(server) {
      // Initialize persistent DB in background when Vite dev server starts
      runMigrations()
        .then(() => seedDatabase())
        .catch((err) => console.error('[PAROSA VITE DEV DB INIT ERROR]:', err));

      server.middlewares.use('/api/admin', (req: any, res: any, next: any) => {
        app(req, res, next);
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
