import express from 'express';
import cors from 'cors';
import { tasksRouter } from './routes/tasks.js';
import { fairnessRouter } from './routes/fairness.js';
import { mealsRouter } from './routes/meals.js';
import { calendarRouter } from './routes/calendar.js';
import { resourcesRouter } from './routes/resources.js';
import { interactionsRouter } from './routes/interactions.js';
import { stressRouter } from './routes/stress.js';
import { errorHandler } from './middleware/errorHandler.js';
import prisma from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000', 10);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/tasks', tasksRouter);
app.use('/api/fairness', fairnessRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/stress', stressRouter);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FamilyOS backend running on http://0.0.0.0:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export default app;
