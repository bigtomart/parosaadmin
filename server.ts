import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/apiRouter';
import { runMigrations } from './src/db/migrate';
import { seedDatabase } from './src/db/seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Endpoints
app.use('/api/admin', apiRouter);

// Serve static build in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function startServer() {
  try {
    console.log('[PAROSA BOOT] Initializing persistent database schemas and seeds...');
    await runMigrations();
    await seedDatabase();
    console.log('[PAROSA BOOT] Database initialization complete.');
  } catch (error) {
    console.error('[PAROSA BOOT] Fatal database startup error:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`PAROSA RBAC Admin Server running on port ${PORT}`);
  });
}

startServer();
