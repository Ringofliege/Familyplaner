import { Router } from 'express';
import prisma from '../db.js';

export const stressRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/stress — current stress mode status
// ---------------------------------------------------------------------------
stressRouter.get('/', async (_req, res) => {
  const active = await prisma.stressMode.findFirst({
    where: { active: true },
    include: { activatedBy: true },
    orderBy: { startDate: 'desc' },
  });

  if (!active) {
    res.json({ active: false });
    return;
  }

  res.json({
    active: true,
    id: active.id,
    activatedBy: active.activatedById,
    activatedByName: active.activatedBy.name,
    reason: active.reason,
    startDate: active.startDate,
    endDate: active.endDate,
  });
});

// ---------------------------------------------------------------------------
// POST /api/stress/activate — activate stress mode
// ---------------------------------------------------------------------------
stressRouter.post('/activate', async (req, res) => {
  const { activatedBy, reason, endDate } = req.body;

  if (!activatedBy) {
    res.status(400).json({ error: 'activatedBy is required' });
    return;
  }

  // Deactivate any existing stress mode first
  await prisma.stressMode.updateMany({
    where: { active: true },
    data: { active: false },
  });

  const stress = await prisma.stressMode.create({
    data: {
      activatedById: activatedBy,
      reason: reason ?? null,
      endDate: endDate ? new Date(endDate) : null,
    },
    include: { activatedBy: true },
  });

  res.status(201).json({
    active: true,
    id: stress.id,
    activatedBy: stress.activatedById,
    activatedByName: stress.activatedBy.name,
    reason: stress.reason,
    startDate: stress.startDate,
    endDate: stress.endDate,
  });
});

// ---------------------------------------------------------------------------
// POST /api/stress/deactivate — deactivate stress mode
// ---------------------------------------------------------------------------
stressRouter.post('/deactivate', async (_req, res) => {
  await prisma.stressMode.updateMany({
    where: { active: true },
    data: { active: false },
  });

  res.json({ active: false });
});
