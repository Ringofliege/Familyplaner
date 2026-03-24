import { Router } from 'express';
import prisma from '../db.js';

export const resourcesRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/resources — all resources
// ---------------------------------------------------------------------------
resourcesRouter.get('/', async (_req, res) => {
  const resources = await prisma.resource.findMany();
  res.json(resources);
});

// ---------------------------------------------------------------------------
// GET /api/resources/:id — single resource
// ---------------------------------------------------------------------------
resourcesRouter.get('/:id', async (req, res) => {
  const resource = await prisma.resource.findUnique({
    where: { id: req.params.id },
  });

  if (!resource) {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }

  res.json(resource);
});

// ---------------------------------------------------------------------------
// PATCH /api/resources/:id — update resource (e.g. car charge level)
// ---------------------------------------------------------------------------
resourcesRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, metadata } = req.body;

  const existing = await prisma.resource.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }

  const updatedMetadata = {
    ...(existing.metadata as Record<string, unknown>),
    ...(metadata ?? {}),
  };

  const resource = await prisma.resource.update({
    where: { id },
    data: {
      status: status ?? existing.status,
      metadata: updatedMetadata,
    },
  });

  res.json(resource);
});
