import { Router } from 'express';
import prisma from '../db.js';
import { todayISO, todayDow } from '../utils/dates.js';

export const tasksRouter = Router();

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
  const {
    title, description, type, category, effort,
    durationMinutes, fairnessPoints, assignedTo,
    preferredAssignee, recurrence, recurrenceDays,
    preferredStart, preferredEnd, dependsOn,
  } = req.body;

  const task = await prisma.taskDefinition.create({
    data: {
      title,
      description,
      type: type ?? 'one-time',
      category: category ?? 'household',
      effort: effort ?? 'light',
      durationMinutes: durationMinutes ?? 15,
      fairnessPoints: fairnessPoints ?? 2,
      assignedToId: assignedTo,
      preferredAssigneeId: preferredAssignee,
      recurrence,
      recurrenceDays: recurrenceDays ?? [],
      preferredStart,
      preferredEnd,
      dependsOn: dependsOn ?? [],
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
  const { completedBy, date: dateParam } = req.body;
  const date = dateParam ?? todayISO();

  if (!completedBy) {
    res.status(400).json({ error: 'completedBy is required' });
    return;
  }

  // Ensure instance exists
  const instance = await prisma.taskInstance.upsert({
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
  const taskDef = await prisma.taskDefinition.findUnique({
    where: { id },
  });

  if (!taskDef) {
    res.status(404).json({ error: 'Task definition not found' });
    return;
  }

  // Create completion record
  const completion = await prisma.taskCompletion.create({
    data: {
      taskInstanceId: instance.id,
      taskDefinitionId: id,
      completedById: completedBy,
      fairnessPoints: taskDef.fairnessPoints,
    },
  });

  // Create fairness record
  await prisma.fairnessRecord.create({
    data: {
      date,
      memberId: completedBy,
      category: taskDef.category,
      points: taskDef.fairnessPoints,
      taskCompletionId: completion.id,
    },
  });

  res.json({ instance, completion });
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
