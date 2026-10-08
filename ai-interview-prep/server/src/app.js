import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import resumeRoutes from './routes/resume.js';
import interviewRoutes from './routes/interviews.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Single-service deployment: serve the built React app with an SPA fallback.
// Skipped when client/dist has not been built (e.g. API-only local dev).
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
const indexHtml = path.join(distDir, 'index.html');
if (existsSync(indexHtml) && statSync(indexHtml).isFile()) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(indexHtml);
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status < 500 || err.expose ? err.message : 'Something went wrong on the server.' });
});

export default app;
