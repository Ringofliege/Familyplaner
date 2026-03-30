import { describe, it, expect } from 'vitest';
import {
  calculatePoints,
  calculateFairnessScore,
  getFairnessBalance,
} from '../fairness';
import type { Task, FairnessRecord, FairnessScore } from '../../models/types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-task',
    title: 'Test',
    type: 'recurring',
    category: 'household',
    effort: 'light',
    durationMinutes: 15,
    fairnessPoints: 2,
    ...overrides,
  };
}

describe('calculatePoints', () => {
  it('returns 1 for passive effort (household, recurring)', () => {
    const task = makeTask({ effort: 'passive', durationMinutes: 10 });
    // base=1, household(×1.0), recurring(×1.0) = 1
    expect(calculatePoints(task)).toBe(1);
  });

  it('returns 2 for light effort (household, recurring)', () => {
    const task = makeTask({ effort: 'light', durationMinutes: 10 });
    // base=2, household(×1.0), recurring(×1.0) = 2
    expect(calculatePoints(task)).toBe(2);
  });

  it('returns 4 for moderate effort (household, recurring)', () => {
    const task = makeTask({ effort: 'moderate', durationMinutes: 10 });
    // base=4, household(×1.0), recurring(×1.0) = 4
    expect(calculatePoints(task)).toBe(4);
  });

  it('returns 6 for heavy effort (household, recurring)', () => {
    const task = makeTask({ effort: 'heavy', durationMinutes: 10 });
    // base=6, household(×1.0), recurring(×1.0) = 6
    expect(calculatePoints(task)).toBe(6);
  });

  it('applies ×1.5 mental-load type multiplier', () => {
    const base = makeTask({ effort: 'moderate', type: 'recurring', durationMinutes: 10 });
    const mentalLoad = makeTask({ effort: 'moderate', type: 'mental-load', durationMinutes: 10 });
    const basePoints = calculatePoints(base);
    const mlPoints = calculatePoints(mentalLoad);
    expect(mlPoints).toBe(basePoints * 1.5);
  });

  it('applies ×2.0 childcare category multiplier', () => {
    const base = makeTask({ effort: 'light', category: 'household', durationMinutes: 10 });
    const childcare = makeTask({ effort: 'light', category: 'childcare', durationMinutes: 10 });
    const basePoints = calculatePoints(base);
    const ccPoints = calculatePoints(childcare);
    expect(ccPoints).toBe(basePoints * 2.0);
  });

  it('stacks mental-load and childcare multipliers', () => {
    const task = makeTask({
      effort: 'passive',
      type: 'mental-load',
      category: 'childcare',
      durationMinutes: 10,
    });
    // base=1, ×2.0 childcare, ×1.5 mental-load = 3
    expect(calculatePoints(task)).toBe(3);
  });

  it('applies tiered duration bonus: 16-30 min → +1', () => {
    const short = makeTask({ effort: 'light', durationMinutes: 15 });
    const long = makeTask({ effort: 'light', durationMinutes: 25 });
    // short: base=2, no bonus = 2; long: base=2 + 1 = 3
    expect(calculatePoints(short)).toBe(2);
    expect(calculatePoints(long)).toBe(calculatePoints(short) + 1);
  });

  it('applies tiered duration bonus: 61-120 min → +4', () => {
    const base = makeTask({ effort: 'light', durationMinutes: 10 });
    const long = makeTask({ effort: 'light', durationMinutes: 75 });
    // base: 2; long: 2 + 4 = 6
    expect(calculatePoints(long)).toBe(calculatePoints(base) + 4);
  });

  it('never returns less than 1', () => {
    const task = makeTask({ effort: 'passive', durationMinutes: 1 });
    expect(calculatePoints(task)).toBeGreaterThanOrEqual(1);
  });

  it('clamps to maximum 20 points', () => {
    const task = makeTask({
      effort: 'heavy',
      category: 'childcare',
      type: 'mental-load',
      durationMinutes: 180,
    });
    // base=6, ×2.0 childcare, ×1.5 mental-load = 18, +6 duration = 24 → clamped to 20
    expect(calculatePoints(task)).toBe(20);
  });

  it('applies ×0.5 personal category multiplier', () => {
    const task = makeTask({
      effort: 'passive',
      category: 'personal',
      type: 'mental-load',
      durationMinutes: 15,
    });
    // base=1, ×0.5 personal, ×1.5 mental-load = 0.75 → clamped to 1
    expect(calculatePoints(task)).toBe(1);
  });

  it('adds +1 bonus on high-load day', () => {
    const task = makeTask({ effort: 'light', durationMinutes: 10 });
    const normal = calculatePoints(task, false);
    const highLoad = calculatePoints(task, true);
    expect(highLoad).toBe(normal + 1);
  });
});

describe('calculateFairnessScore', () => {
  it('aggregates records correctly by category', () => {
    const records: FairnessRecord[] = [
      { date: '2025-01-01', taskId: 't1', memberId: 'mother', category: 'childcare', points: 5 },
      { date: '2025-01-01', taskId: 't2', memberId: 'mother', category: 'household', points: 3 },
      { date: '2025-01-01', taskId: 't3', memberId: 'mother', category: 'pets', points: 2 },
      { date: '2025-01-01', taskId: 't4', memberId: 'mother', category: 'admin', points: 4 },
      { date: '2025-01-01', taskId: 't5', memberId: 'mother', category: 'food', points: 1 },
    ];
    const score = calculateFairnessScore(records);
    expect(score.memberId).toBe('mother');
    expect(score.childcare).toBe(5);
    expect(score.pets).toBe(2);
    expect(score.mentalLoad).toBe(4); // admin → mentalLoad
    expect(score.household).toBe(4); // household(3) + food(1)
    expect(score.total).toBe(15);
  });

  it('folds garden and personal into household', () => {
    const records: FairnessRecord[] = [
      { date: '2025-01-01', taskId: 't1', memberId: 'father', category: 'garden', points: 3 },
      { date: '2025-01-01', taskId: 't2', memberId: 'father', category: 'personal', points: 2 },
    ];
    const score = calculateFairnessScore(records);
    expect(score.household).toBe(5);
    expect(score.total).toBe(5);
  });

  it('returns zero score for empty records', () => {
    const score = calculateFairnessScore([]);
    expect(score.total).toBe(0);
    expect(score.childcare).toBe(0);
    expect(score.household).toBe(0);
    expect(score.mentalLoad).toBe(0);
    expect(score.pets).toBe(0);
  });
});

describe('getFairnessBalance', () => {
  it('identifies balanced workload when totals are similar', () => {
    const mother: FairnessScore = {
      memberId: 'mother',
      childcare: 10,
      household: 10,
      mentalLoad: 5,
      pets: 5,
      total: 30,
    };
    const father: FairnessScore = {
      memberId: 'father',
      childcare: 10,
      household: 10,
      mentalLoad: 5,
      pets: 5,
      total: 30,
    };
    const balance = getFairnessBalance(mother, father);
    expect(balance.ratio).toBe(1);
    expect(balance.advantageMember).toBe('balanced');
    expect(balance.imbalancePercent).toBe(0);
  });

  it('identifies imbalanced workload', () => {
    const mother: FairnessScore = {
      memberId: 'mother',
      childcare: 5,
      household: 5,
      mentalLoad: 0,
      pets: 0,
      total: 10,
    };
    const father: FairnessScore = {
      memberId: 'father',
      childcare: 10,
      household: 10,
      mentalLoad: 5,
      pets: 5,
      total: 30,
    };
    const balance = getFairnessBalance(mother, father);
    expect(balance.ratio).toBe(3); // 30/10
    expect(balance.advantageMember).toBe('mother'); // mother does less
    expect(balance.imbalancePercent).toBeGreaterThan(0);
  });

  it('handles both members with 0 records gracefully', () => {
    const zero: FairnessScore = {
      memberId: 'mother',
      childcare: 0,
      household: 0,
      mentalLoad: 0,
      pets: 0,
      total: 0,
    };
    const zeroFather: FairnessScore = { ...zero, memberId: 'father' };
    const balance = getFairnessBalance(zero, zeroFather);
    expect(balance.ratio).toBe(1);
    expect(balance.advantageMember).toBe('balanced');
    expect(balance.imbalancePercent).toBe(0);
  });

  it('handles one member with 0 points', () => {
    const mother: FairnessScore = {
      memberId: 'mother',
      childcare: 0,
      household: 0,
      mentalLoad: 0,
      pets: 0,
      total: 0,
    };
    const father: FairnessScore = {
      memberId: 'father',
      childcare: 10,
      household: 10,
      mentalLoad: 0,
      pets: 0,
      total: 20,
    };
    const balance = getFairnessBalance(mother, father);
    // min is 0, so ratio = max (20)
    expect(balance.ratio).toBe(20);
    expect(balance.advantageMember).toBe('mother'); // mother does nothing
    expect(balance.imbalancePercent).toBe(100); // completely lopsided
  });

  it('ratio is always >= 1', () => {
    const mother: FairnessScore = {
      memberId: 'mother',
      childcare: 5,
      household: 5,
      mentalLoad: 0,
      pets: 0,
      total: 10,
    };
    const father: FairnessScore = {
      memberId: 'father',
      childcare: 3,
      household: 3,
      mentalLoad: 0,
      pets: 0,
      total: 6,
    };
    const balance = getFairnessBalance(mother, father);
    expect(balance.ratio).toBeGreaterThanOrEqual(1);
  });
});
