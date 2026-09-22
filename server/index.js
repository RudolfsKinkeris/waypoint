import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import testCasesRouter from './routes/test-cases.js';
import suitesRouter from './routes/suites.js';
import bugsRouter from './routes/bugs.js';
import testRunsRouter from './routes/test-runs.js';
import dashboardRouter from './routes/dashboard.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';
import searchRouter from './routes/search.js';
import { seedTestCases, seedSuites, seedBugs, seedTestRuns, seedReports, seedSettings } from './seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// A CSV import can post a few hundred test cases in one request, which
// exceeds body-parser's 100kb default well before that's an unreasonable
// payload size.
app.use(express.json({ limit: '5mb' }));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Example endpoint the client calls on load
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.use('/api/test-cases', testCasesRouter);
app.use('/api/suites', suitesRouter);
app.use('/api/bugs', bugsRouter);
app.use('/api/test-runs', testRunsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/search', searchRouter);

seedTestCases();
seedSuites();
seedBugs();
seedTestRuns();
seedReports();
seedSettings();

// In production there's no separate Vite dev server — this same process
// serves the client's built static files too, so the whole app is one
// deployable service. Locally, client/dist doesn't exist (Vite's own dev
// server handles the client instead), so this block is a no-op there.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// General error handler — must be defined last, and must have exactly four
// parameters (err, req, res, next) for Express to recognize it as one.
// This project runs Express 4 (not 5), which does NOT auto-forward a
// rejected promise from an async handler to this middleware — every route
// handler here is synchronous with its own try/catch, but this stays as a
// backstop for anything that slips through uncaught.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, data: null, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
