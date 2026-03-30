import { Router } from 'express';
import prisma from '../db.js';

export const mealsRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/meals — all meal definitions
// ---------------------------------------------------------------------------
mealsRouter.get('/', async (_req, res) => {
  const meals = await prisma.meal.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(meals);
});

// ---------------------------------------------------------------------------
// POST /api/meals — create a new meal
// ---------------------------------------------------------------------------
mealsRouter.post('/', async (req, res) => {
  const { name, difficulty, prepTimeMinutes, cookTimeMinutes, servings, tags, ingredients, cookidooId } = req.body;

  const meal = await prisma.meal.create({
    data: {
      name,
      difficulty: difficulty ?? 'easy',
      prepTimeMinutes: prepTimeMinutes ?? 15,
      cookTimeMinutes: cookTimeMinutes ?? 15,
      servings: servings ?? 4,
      tags: tags ?? [],
      ingredients: ingredients ?? [],
      cookidooId,
    },
  });

  res.status(201).json(meal);
});

// ---------------------------------------------------------------------------
// GET /api/meals/plan — meal plan for a week
// ---------------------------------------------------------------------------
mealsRouter.get('/plan', async (req, res) => {
  const startDate = req.query.start as string;
  const endDate = req.query.end as string;

  const where: Record<string, unknown> = {};
  if (startDate && endDate) {
    where.date = { gte: startDate, lte: endDate };
  }

  const entries = await prisma.mealPlanEntry.findMany({
    where,
    include: {
      meal: true,
      assignedTo: true,
    },
    orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
  });

  res.json(entries);
});

// ---------------------------------------------------------------------------
// POST /api/meals/plan — add/update a meal plan entry
// ---------------------------------------------------------------------------
mealsRouter.post('/plan', async (req, res) => {
  const { date, mealType, mealId, assignedTo, notes } = req.body;

  if (!date || !mealType) {
    res.status(400).json({ error: 'date and mealType are required' });
    return;
  }

  const entry = await prisma.mealPlanEntry.upsert({
    where: {
      date_mealType: { date, mealType },
    },
    update: {
      mealId: mealId ?? null,
      assignedToId: assignedTo ?? null,
      notes: notes ?? null,
    },
    create: {
      date,
      mealType,
      mealId: mealId ?? null,
      assignedToId: assignedTo ?? null,
      notes: notes ?? null,
    },
    include: {
      meal: true,
      assignedTo: true,
    },
  });

  res.json(entry);
});

// ---------------------------------------------------------------------------
// DELETE /api/meals/plan — remove a meal plan entry
// ---------------------------------------------------------------------------
mealsRouter.delete('/plan', async (req, res) => {
  const { date, mealType } = req.body;

  if (!date || !mealType) {
    res.status(400).json({ error: 'date and mealType are required' });
    return;
  }

  try {
    await prisma.mealPlanEntry.delete({
      where: {
        date_mealType: { date, mealType },
      },
    });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Entry not found' });
  }
});
