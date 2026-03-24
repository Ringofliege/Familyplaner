import { Router } from 'express';
import prisma from '../db.js';

export const calendarRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/calendar — all calendar events, optionally filtered by day
// ---------------------------------------------------------------------------
calendarRouter.get('/', async (req, res) => {
  const day = req.query.day as string | undefined;

  const where: Record<string, unknown> = {};
  if (day !== undefined) {
    where.dayOfWeek = parseInt(day, 10);
  }

  const events = await prisma.calendarEvent.findMany({
    where,
    include: { owner: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  res.json(events);
});

// ---------------------------------------------------------------------------
// POST /api/calendar — create a calendar event
// ---------------------------------------------------------------------------
calendarRouter.post('/', async (req, res) => {
  const { title, dayOfWeek, startTime, endTime, ownerId, ownerType, type, color, isRecurring } = req.body;

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      dayOfWeek,
      startTime,
      endTime,
      ownerId: ownerId ?? null,
      ownerType: ownerType ?? (ownerId ? 'member' : 'family'),
      type: type ?? 'personal',
      color: color ?? null,
      isRecurring: isRecurring ?? true,
    },
  });

  res.status(201).json(event);
});

// ---------------------------------------------------------------------------
// DELETE /api/calendar/:id — delete a calendar event
// ---------------------------------------------------------------------------
calendarRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.calendarEvent.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Event not found' });
  }
});
