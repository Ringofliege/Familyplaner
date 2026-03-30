import { Router } from 'express';
import prisma from '../db.js';
import { weekStartISO, weekEndISO } from '../utils/dates.js';

export const fairnessRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/fairness — current week's fairness summary
// ---------------------------------------------------------------------------
fairnessRouter.get('/', async (req, res) => {
  const startDate = (req.query.start as string) ?? weekStartISO();
  const endDate = (req.query.end as string) ?? weekEndISO();

  const records = await prisma.fairnessRecord.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: { member: true },
  });

  // Aggregate by member
  const scores: Record<string, {
    memberId: string;
    memberName: string;
    childcare: number;
    household: number;
    mentalLoad: number;
    pets: number;
    total: number;
  }> = {};

  for (const r of records) {
    if (!scores[r.memberId]) {
      scores[r.memberId] = {
        memberId: r.memberId,
        memberName: r.member.name,
        childcare: 0,
        household: 0,
        mentalLoad: 0,
        pets: 0,
        total: 0,
      };
    }

    const s = scores[r.memberId];
    switch (r.category) {
      case 'childcare':
        s.childcare += r.points;
        break;
      case 'pets':
        s.pets += r.points;
        break;
      case 'admin':
        s.mentalLoad += r.points;
        break;
      default:
        s.household += r.points;
        break;
    }
    s.total += r.points;
  }

  const mother = scores['mother'] ?? { memberId: 'mother', memberName: 'Mama', childcare: 0, household: 0, mentalLoad: 0, pets: 0, total: 0 };
  const father = scores['father'] ?? { memberId: 'father', memberName: 'Papa', childcare: 0, household: 0, mentalLoad: 0, pets: 0, total: 0 };

  // Balance calculation
  const mTotal = mother.total;
  const fTotal = father.total;
  const max = Math.max(mTotal, fTotal);
  const min = Math.min(mTotal, fTotal);
  const ratio = (mTotal === 0 && fTotal === 0) ? 1 : min === 0 ? max : Math.round((max / min) * 100) / 100;
  const totalPoints = mTotal + fTotal;
  const imbalancePercent = totalPoints === 0 ? 0 : Math.round(Math.abs(mTotal / totalPoints - 0.5) * 200 * 100) / 100;

  let advantageMember: string;
  if (ratio < 1.1) {
    advantageMember = 'balanced';
  } else {
    advantageMember = mTotal < fTotal ? 'mother' : 'father';
  }

  res.json({
    period: { start: startDate, end: endDate },
    mother,
    father,
    balance: { ratio, advantageMember, imbalancePercent },
    recordCount: records.length,
  });
});

// ---------------------------------------------------------------------------
// GET /api/fairness/history — fairness records for a date range
// ---------------------------------------------------------------------------
fairnessRouter.get('/history', async (req, res) => {
  const startDate = req.query.start as string;
  const endDate = req.query.end as string;

  if (!startDate || !endDate) {
    res.status(400).json({ error: 'start and end query params required' });
    return;
  }

  const records = await prisma.fairnessRecord.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: { member: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(records);
});
