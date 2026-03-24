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
  it('returns 1 for passive effort', () => {
    const task = makeTask({ effort: 'passive', durationMinutes: 10 });
    expect(calculatePoints(task)).toBe(1);
  });

  it('returns 2 for light effort', () => {
    const task = makeTask({ effort: 'light', durationMinutes: 10 });
    expect(calculatePoints(task)).toBe(2);
  });

  it('returns 3 for moderate effort', () => {
    const task = makeTask({ effort: 'moderate', durationMinutes: 10 });
    expect(calculatePoints(task)).toBe(3);
  });

  it('returns 5 for heavy effort', () => {
    const task = makeTask({ effort: 'heavy', durationMinutes: 10 });
    expect(calculatePoints(task)).toBe(5);
  });

  it('applies ×1.5 mental load multiplier', () => {
    const base = makeTask({ effort: 'moderate', type: 'recurring', durationMinutes: 10 });
    const mentalLoad = makeTask({ effort: 'moderate', type: 'mental-load', durationMinutes: 10 });
    const basePoints = calculatePoints(base);
    const mlPoints = calculatePoints(mentalLoad);
    expect(mlPoints).toBe(basePoints * 1.5);
  });

  it('applies ×1.5 childcare category multiplier', () => {
    const base = makeTask({ effort: 'light', category: 'household', durationMinutes: 10 });
    const childcare = makeTask({ effort: 'light', category: 'childcare', durationMinutes: 10 });
    const basePoints = calculatePoints(base);
    const ccPoints = calculatePoints(childcare);
    expect(ccPoints).toBe(basePoints * 1.5);
  });

  it('stacks mental-load and childcare multipliers', () => {
    const task = makeTask({
      effort: 'passive',
      type: 'mental-load',
      category: 'childcare',
      durationMinutes: 10,
    });
    // base=1, ×1.5 mental, ×1.5 childcare = 2.25
    expect(calculatePoints(task)).toBe(2.25);
  });

  it('adds +1 duration bonus per 30 min above 15 min', () => {
    // 45 min → 1 full 30-min block above 15 min → +1
    const short = makeTask({ effort: 'light', durationMinutes: 15 });
    const long = makeTask({ effort: 'light', durationMinutes: 45 });
    expect(calculatePoints(long)).toBe(calculatePoints(short) + 1);
  });

  it('adds +2 for 75 min duration', () => {
    // 75 min → (75-15)/30 = 2 → +2
    const base = makeTask({ effort: 'light', durationMinutes: 10 });
    const long = makeTask({ effort: 'light', durationMinutes: 75 });
    expect(calculatePoints(long)).toBe(calculatePoints(base) + 2);
  });

  it('never returns less than 1', () => {
    const task = makeTask({ effort: 'passive', durationMinutes: 1 });
    expect(calculatePoints(task)).toBeGreaterThanOrEqual(1);
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
