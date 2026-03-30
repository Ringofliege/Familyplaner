import { describe, it, expect } from 'vitest';
import {
  assignResponsibility,
  getResponsibleToday,
} from '../responsibility';
import { calculateTimeBlocks } from '../energy';
import type { Task, DayOfWeek, TimeBlock, WorkSchedule } from '../../models/types';
import {
  motherWorkSchedule,
  fatherWorkSchedule,
  allFixedEvents,
} from '../../data/schedules';
import { recurringTasks } from '../../data/tasks';

const workSchedules: Record<string, WorkSchedule[]> = {
  mother: motherWorkSchedule,
  father: fatherWorkSchedule,
};

const mondayBlocks = calculateTimeBlocks(1, workSchedules, allFixedEvents);
const motherBlocks = mondayBlocks.filter((b) => b.owner === 'mother');
const fatherBlocks = mondayBlocks.filter((b) => b.owner === 'father');

const evenScores = { mother: 50, father: 50 };

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-task',
    title: 'Test Task',
    type: 'recurring',
    category: 'household',
    effort: 'light',
    durationMinutes: 15,
    fairnessPoints: 2,
    ...overrides,
  };
}

describe('assignResponsibility', () => {
  it('respects fixed assignments (assignedTo)', () => {
    const task = makeTask({ assignedTo: 'mother' });
    const result = assignResponsibility(task, 1, motherBlocks, fatherBlocks, evenScores);
    expect(result).toBe('mother');
  });

  it('respects fixed assignment even if that member is stressed', () => {
    const task = makeTask({ assignedTo: 'mother' });
    const result = assignResponsibility(task, 1, motherBlocks, fatherBlocks, evenScores, 'mother');
    expect(result).toBe('mother');
  });

  it('uses preferred assignee when available', () => {
    const task = makeTask({ preferredAssignee: 'father' });
    const result = assignResponsibility(task, 1, motherBlocks, fatherBlocks, evenScores);
    expect(result).toBe('father');
  });

  it('overrides preferred assignee under stress mode', () => {
    const task = makeTask({ preferredAssignee: 'mother' });
    const result = assignResponsibility(
      task,
      1,
      motherBlocks,
      fatherBlocks,
      evenScores,
      'mother',
    );
    // Mother is stressed; father should take over if he has free time
    expect(result).toBe('father');
  });

  it('balances fairness: assigns to member with fewer points when availability is similar', () => {
    const task = makeTask();
    // Mother has fewer points → should get the task
    const unbalanced = { mother: 10, father: 50 };
    const result = assignResponsibility(task, 1, motherBlocks, fatherBlocks, unbalanced);
    expect(result).toBe('mother');
  });

  it('assigns to member with more free time when there is a significant difference', () => {
    // Use a day where one member is very busy
    const wedBlocks = calculateTimeBlocks(3, workSchedules, allFixedEvents);
    const mBlocks = wedBlocks.filter((b) => b.owner === 'mother');
    const fBlocks = wedBlocks.filter((b) => b.owner === 'father');
    const task = makeTask();
    const result = assignResponsibility(task, 3, mBlocks, fBlocks, evenScores);
    // Father has shorter work day Wed (08:00-12:00 remote) vs mother (09:00-15:00 office + commute + training)
    expect(result).toBe('father');
  });

  describe('child logistics defaults', () => {
    it('father brings Mon-Tue, Thu-Fri', () => {
      const dropoff = makeTask({
        id: 'childcare-bring',
        title: 'Kind bringen',
        category: 'childcare',
      });
      for (const day of [1, 2, 4, 5] as DayOfWeek[]) {
        const blocks = calculateTimeBlocks(day, workSchedules, allFixedEvents);
        const mB = blocks.filter((b) => b.owner === 'mother');
        const fB = blocks.filter((b) => b.owner === 'father');
        const result = assignResponsibility(dropoff, day, mB, fB, evenScores);
        expect(result).toBe('father');
      }
    });

    it('mother brings on Wednesday', () => {
      const dropoff = makeTask({
        id: 'childcare-bring-wed',
        title: 'Kind bringen',
        category: 'childcare',
      });
      const wedBlocks = calculateTimeBlocks(3, workSchedules, allFixedEvents);
      const mB = wedBlocks.filter((b) => b.owner === 'mother');
      const fB = wedBlocks.filter((b) => b.owner === 'father');
      const result = assignResponsibility(dropoff, 3, mB, fB, evenScores);
      expect(result).toBe('mother');
    });

    it('mother picks up Mon-Tue, Thu-Fri', () => {
      const pickup = makeTask({
        id: 'childcare-pickup',
        title: 'Kind abholen',
        category: 'childcare',
      });
      for (const day of [1, 2, 4, 5] as DayOfWeek[]) {
        const blocks = calculateTimeBlocks(day, workSchedules, allFixedEvents);
        const mB = blocks.filter((b) => b.owner === 'mother');
        const fB = blocks.filter((b) => b.owner === 'father');
        const result = assignResponsibility(pickup, day, mB, fB, evenScores);
        expect(result).toBe('mother');
      }
    });

    it('father picks up on Wednesday', () => {
      const pickup = makeTask({
        id: 'childcare-pickup-wed',
        title: 'Kind abholen',
        category: 'childcare',
      });
      const wedBlocks = calculateTimeBlocks(3, workSchedules, allFixedEvents);
      const mB = wedBlocks.filter((b) => b.owner === 'mother');
      const fB = wedBlocks.filter((b) => b.owner === 'father');
      const result = assignResponsibility(pickup, 3, mB, fB, evenScores);
      expect(result).toBe('father');
    });
  });

  it('returns null when both members are fully blocked', () => {
    // Create blocks where every slot is blocked
    const allBlocked: TimeBlock[] = [];
    for (let m = 6 * 60; m < 24 * 60; m += 30) {
      const start = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const end = `${String(Math.floor((m + 30) / 60)).padStart(2, '0')}:${String((m + 30) % 60).padStart(2, '0')}`;
      for (const owner of ['mother', 'father'] as const) {
        allBlocked.push({
          day: 1,
          slot: { start, end },
          status: 'blocked',
          owner,
          reason: 'work',
        });
      }
    }
    const task = makeTask();
    const mB = allBlocked.filter((b) => b.owner === 'mother');
    const fB = allBlocked.filter((b) => b.owner === 'father');
    const result = assignResponsibility(task, 1, mB, fB, evenScores);
    expect(result).toBeNull();
  });

  it('stress mode reduces assignments for stressed member', () => {
    const task = makeTask();
    const result = assignResponsibility(
      task,
      1,
      motherBlocks,
      fatherBlocks,
      evenScores,
      'mother',
    );
    // With stress on mother, father should take over (if he has capacity)
    expect(result).toBe('father');
  });
});

describe('getResponsibleToday', () => {
  it('returns a map for every task provided', () => {
    // Use a subset of recurring tasks that apply to Monday
    const mondayTasks = recurringTasks.filter(
      (t) => !t.recurrenceDays || t.recurrenceDays.includes(1),
    );
    const result = getResponsibleToday(1, mondayTasks, mondayBlocks, evenScores);
    expect(result).toBeInstanceOf(Map);
    // Every task should have an assignment (unless both blocked, which shouldn't happen on a normal day)
    expect(result.size).toBeGreaterThan(0);
    expect(result.size).toBeLessThanOrEqual(mondayTasks.length);
  });

  it('respects fixed assignments in the result map', () => {
    // task-laundry-put-away is assignedTo father
    const tasks = recurringTasks.filter((t) => t.id === 'task-laundry-put-away');
    const result = getResponsibleToday(1, tasks, mondayBlocks, evenScores);
    expect(result.get('task-laundry-put-away')).toBe('father');
  });

  it('returns an empty map for empty task list', () => {
    const result = getResponsibleToday(1, [], mondayBlocks, evenScores);
    expect(result.size).toBe(0);
  });
});
