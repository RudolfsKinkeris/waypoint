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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
