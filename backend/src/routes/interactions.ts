import { Router } from 'express';
import prisma from '../db.js';

export const interactionsRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/interactions/thank-yous — recent thank-yous
// ---------------------------------------------------------------------------
interactionsRouter.get('/thank-yous', async (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 20;

  const thankYous = await prisma.thankYou.findMany({
    include: {
      from: true,
      to: true,
      task: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
  });

  res.json(thankYous);
});

// ---------------------------------------------------------------------------
// POST /api/interactions/thank-yous — send a thank-you
// ---------------------------------------------------------------------------
interactionsRouter.post('/thank-yous', async (req, res) => {
  const { from, to, taskId, message } = req.body;

  if (!from || !to) {
    res.status(400).json({ error: 'from and to are required' });
    return;
  }

  const thankYou = await prisma.thankYou.create({
    data: {
      fromId: from,
      toId: to,
      taskId: taskId ?? null,
      message: message ?? null,
    },
    include: {
      from: true,
      to: true,
    },
  });

  res.status(201).json(thankYou);
});

// ---------------------------------------------------------------------------
// GET /api/interactions/take-overs — recent take-overs
// ---------------------------------------------------------------------------
interactionsRouter.get('/take-overs', async (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 20;

  const takeOvers = await prisma.takeOver.findMany({
    include: {
      from: true,
      to: true,
      task: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
  });

  res.json(takeOvers);
});

// ---------------------------------------------------------------------------
// POST /api/interactions/take-overs — take over a task
// ---------------------------------------------------------------------------
interactionsRouter.post('/take-overs', async (req, res) => {
  const { taskId, from, to } = req.body;

  if (!taskId || !from || !to) {
    res.status(400).json({ error: 'taskId, from, and to are required' });
    return;
  }

  // Update task assignment
  await prisma.taskDefinition.update({
    where: { id: taskId },
    data: { assignedToId: to },
  });

  const takeOver = await prisma.takeOver.create({
    data: {
      taskId,
      fromId: from,
      toId: to,
    },
    include: {
      from: true,
      to: true,
      task: true,
    },
  });

  res.status(201).json(takeOver);
});
