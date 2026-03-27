import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { todayISO, todayDow } from '../utils/dates.js';

export const tasksRouter = Router();

class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Task definition '${id}' not found`);
    this.name = 'TaskNotFoundError';
  }
}

// ---------------------------------------------------------------------------
// Zod schemas for request validation
// ---------------------------------------------------------------------------

const createTaskSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  type: z.enum(['recurring', 'one-time', 'project', 'mental-load']).default('one-time'),
  category: z.enum(['childcare', 'household', 'pets', 'food', 'admin', 'personal', 'garden']).default('household'),
  effort: z.enum(['passive', 'light', 'moderate', 'heavy']).default('light'),
  durationMinutes: z.number().int().positive().default(15),
  fairnessPoints: z.number().int().min(0).default(2),
  assignedTo: z.string().optional(),
  preferredAssignee: z.string().optional(),
  recurrence: z.enum(['daily', 'weekday', 'weekly', 'biweekly', 'monthly']).optional(),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).default([]),
  preferredStart: z.string().optional(),
  preferredEnd: z.string().optional(),
  dependsOn: z.array(z.string()).default([]),
});

const completeTaskSchema = z.object({
  completedBy: z.string().min(1, 'completedBy is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/tasks — all active task definitions
// ---------------------------------------------------------------------------
tasksRouter.get('/', async (_req, res) => {
  const tasks = await prisma.taskDefinition.findMany({
    where: { isActive: true },
    include: {
      assignedTo: true,
      preferredAssignee: true,
    },
    orderBy: { title: 'asc' },
  });
  res.json(tasks);
});

// ---------------------------------------------------------------------------
// GET /api/tasks/today — today's task instances with completion status
// ---------------------------------------------------------------------------
tasksRouter.get('/today', async (_req, res) => {
  const date = todayISO();
  const dow = todayDow();

  // Find all task definitions applicable to today
  const definitions = await prisma.taskDefinition.findMany({
    where: {
      isActive: true,
      OR: [
        { recurrence: 'daily' },
        { recurrence: 'weekday', recurrenceDays: { isEmpty: true } },
        { recurrenceDays: { has: dow } },
        // one-time tasks with no recurrence should show up if they have an instance for today
        { recurrence: null, instances: { some: { date } } },
      ],
    },
    include: {
      assignedTo: true,
      preferredAssignee: true,
    },
  });

  // Filter weekday tasks to Mon-Fri
  const filtered = definitions.filter((d) => {
    if (d.recurrence === 'weekday') return dow >= 1 && dow <= 5;
    return true;
  });

  // Ensure instances exist for today (upsert pattern)
  const instances = await Promise.all(
    filtered.map(async (def) => {
      const instance = await prisma.taskInstance.upsert({
        where: {
          taskDefinitionId_date: { taskDefinitionId: def.id, date },
        },
        update: {},
        create: {
          taskDefinitionId: def.id,
          date,
          status: 'pending',
        },
        include: {
          completion: {
            include: { completedBy: true },
          },
        },
      });
      return { definition: def, instance };
    }),
  );

  res.json(instances);
});

// ---------------------------------------------------------------------------
// POST /api/tasks — create a new task definition
// ---------------------------------------------------------------------------
tasksRouter.post('/', async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const {
    title, description, type, category, effort,
    durationMinutes, fairnessPoints, assignedTo,
    preferredAssignee, recurrence, recurrenceDays,
    preferredStart, preferredEnd, dependsOn,
  } = parsed.data;

  const task = await prisma.taskDefinition.create({
    data: {
      title,
      description,
      type,
      category,
      effort,
      durationMinutes,
      fairnessPoints,
      assignedToId: assignedTo,
      preferredAssigneeId: preferredAssignee,
      recurrence,
      recurrenceDays,
      preferredStart,
      preferredEnd,
      dependsOn,
    },
  });

  res.status(201).json(task);
});

// ---------------------------------------------------------------------------
// PATCH /api/tasks/:id — update a task definition
// ---------------------------------------------------------------------------
tasksRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Map frontend field names to Prisma field names
  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.type !== undefined) data.type = updates.type;
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.effort !== undefined) data.effort = updates.effort;
  if (updates.durationMinutes !== undefined) data.durationMinutes = updates.durationMinutes;
  if (updates.fairnessPoints !== undefined) data.fairnessPoints = updates.fairnessPoints;
  if (updates.assignedTo !== undefined) data.assignedToId = updates.assignedTo;
  if (updates.preferredAssignee !== undefined) data.preferredAssigneeId = updates.preferredAssignee;
  if (updates.recurrence !== undefined) data.recurrence = updates.recurrence;
  if (updates.recurrenceDays !== undefined) data.recurrenceDays = updates.recurrenceDays;
  if (updates.isActive !== undefined) data.isActive = updates.isActive;

  const task = await prisma.taskDefinition.update({
    where: { id },
    data,
  });

  res.json(task);
});

// ---------------------------------------------------------------------------
// DELETE /api/tasks/:id — soft-delete (deactivate) a task definition
// ---------------------------------------------------------------------------
tasksRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  await prisma.taskDefinition.update({
    where: { id },
    data: { isActive: false },
  });

  res.status(204).end();
});

// ---------------------------------------------------------------------------
// POST /api/tasks/:id/complete — mark a task instance as completed
// ---------------------------------------------------------------------------
tasksRouter.post('/:id/complete', async (req, res) => {
  const { id } = req.params; // task definition ID
  const parsed = completeTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { completedBy, date: dateParam } = parsed.data;
  const date = dateParam ?? todayISO();

  try {
    // Atomic transaction: upsert instance → upsert completion → upsert fairness record
    const result = await prisma.$transaction(async (tx) => {
      // Ensure instance exists
      const instance = await tx.taskInstance.upsert({
        where: {
          taskDefinitionId_date: { taskDefinitionId: id, date },
        },
        update: { status: 'completed' },
        create: {
          taskDefinitionId: id,
          date,
          status: 'completed',
        },
      });

      // Get task definition for fairness points
      const taskDef = await tx.taskDefinition.findUnique({
        where: { id },
      });

      if (!taskDef) {
        throw new TaskNotFoundError(id);
      }

      // Create or reuse completion record (idempotent)
      let completion = await tx.taskCompletion.findUnique({
        where: { taskInstanceId: instance.id },
      });

      if (!completion) {
        completion = await tx.taskCompletion.create({
          data: {
            taskInstanceId: instance.id,
            taskDefinitionId: id,
            completedById: completedBy,
            fairnessPoints: taskDef.fairnessPoints,
          },
        });
      }

      // Create or reuse fairness record (idempotent)
      const existingFairness = await tx.fairnessRecord.findFirst({
        where: { taskCompletionId: completion.id },
      });

      if (!existingFairness) {
        await tx.fairnessRecord.create({
          data: {
            date,
            memberId: completedBy,
            category: taskDef.category,
            points: taskDef.fairnessPoints,
            taskCompletionId: completion.id,
          },
        });
      }

      return { instance, completion };
    });

    res.json(result);
  } catch (err) {
    if (err instanceof TaskNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// POST /api/tasks/:id/skip — skip a task instance for today
// ---------------------------------------------------------------------------
tasksRouter.post('/:id/skip', async (req, res) => {
  const { id } = req.params;
  const date = req.body.date ?? todayISO();

  const instance = await prisma.taskInstance.upsert({
    where: {
      taskDefinitionId_date: { taskDefinitionId: id, date },
    },
    update: { status: 'skipped' },
    create: {
      taskDefinitionId: id,
      date,
      status: 'skipped',
    },
  });

  res.json(instance);
});
