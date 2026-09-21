import express from 'express';
import cors from 'cors';
import testCasesRouter from './routes/test-cases.js';
import suitesRouter from './routes/suites.js';
import bugsRouter from './routes/bugs.js';
import { seedTestCases, seedSuites, seedBugs } from './seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

seedTestCases();
seedSuites();
seedBugs();

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
