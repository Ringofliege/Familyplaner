import { describe, it, expect } from 'vitest';
import { generateDailySuggestions } from '../automation';
import { calculateTimeBlocks } from '../energy';
import type {
  Task,
  TimeBlock,
  CarResource,
  StressMode,
  WorkSchedule,
} from '../../models/types';
import {
  motherWorkSchedule,
  fatherWorkSchedule,
  allFixedEvents,
} from '../../data/schedules';
import { carResource as defaultCar } from '../../data/resources';

const workSchedules: Record<string, WorkSchedule[]> = {
  mother: motherWorkSchedule,
  father: fatherWorkSchedule,
};

const mondayBlocks = calculateTimeBlocks(1, workSchedules, allFixedEvents);
const noStress: StressMode = { active: false };

function makeCar(chargeLevel: number): CarResource {
  return {
    ...defaultCar,
    metadata: {
      ...defaultCar.metadata,
      chargeLevel,
    },
  };
}

describe('generateDailySuggestions', () => {
  it('generates car charging reminder on Monday when charge < 80%', () => {
    const lowCharge = makeCar(50);
    const suggestions = generateDailySuggestions(1, [], mondayBlocks, lowCharge, noStress);
    const carReminder = suggestions.find((s) => s.title === 'Auto laden');
    expect(carReminder).toBeDefined();
    expect(carReminder!.priority).toBe('high');
    expect(carReminder!.assignedTo).toBe('father');
    expect(carReminder!.description).toContain('50');
  });

  it('does NOT generate car charging reminder when charge >= 80%', () => {
    const fullCharge = makeCar(80);
    const suggestions = generateDailySuggestions(1, [], mondayBlocks, fullCharge, noStress);
    const carReminder = suggestions.find((s) => s.title === 'Auto laden');
    expect(carReminder).toBeUndefined();
  });

  it('generates car charging reminder on Tuesday', () => {
    const tueBlocks = calculateTimeBlocks(2, workSchedules, allFixedEvents);
    const lowCharge = makeCar(60);
    const suggestions = generateDailySuggestions(2, [], tueBlocks, lowCharge, noStress);
    const carReminder = suggestions.find((s) => s.title === 'Auto laden');
    expect(carReminder).toBeDefined();
  });

  it('does NOT generate car charging reminder on Wednesday', () => {
    const wedBlocks = calculateTimeBlocks(3, workSchedules, allFixedEvents);
    const lowCharge = makeCar(50);
    const suggestions = generateDailySuggestions(3, [], wedBlocks, lowCharge, noStress);
    const carReminder = suggestions.find((s) => s.title === 'Auto laden');
    expect(carReminder).toBeUndefined();
  });

  it('generates cleaning lady cash reminder on Tuesday', () => {
    const tueBlocks = calculateTimeBlocks(2, workSchedules, allFixedEvents);
    const suggestions = generateDailySuggestions(2, [], tueBlocks, defaultCar, noStress);
    const cashReminder = suggestions.find((s) => s.title === 'Bargeld für Putzfrau');
    expect(cashReminder).toBeDefined();
    expect(cashReminder!.priority).toBe('medium');
    expect(cashReminder!.assignedTo).toBe('mother');
  });

  it('does NOT generate cleaning lady reminder on non-Tuesday', () => {
    const suggestions = generateDailySuggestions(1, [], mondayBlocks, defaultCar, noStress);
    const cashReminder = suggestions.find((s) => s.title === 'Bargeld für Putzfrau');
    expect(cashReminder).toBeUndefined();
  });

  it('generates high load warning when > 12 blocked slots (6 hours)', () => {
    // Create heavily blocked day
    const allBlocked: TimeBlock[] = [];
    for (let m = 6 * 60; m < 24 * 60; m += 30) {
      const start = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const end = `${String(Math.floor((m + 30) / 60)).padStart(2, '0')}:${String((m + 30) % 60).padStart(2, '0')}`;
      allBlocked.push({
        day: 1,
        slot: { start, end },
        status: 'blocked',
        owner: 'mother',
        reason: 'work',
      });
      allBlocked.push({
        day: 1,
        slot: { start, end },
        status: 'free',
        owner: 'father',
        reason: '',
      });
    }

    const suggestions = generateDailySuggestions(1, [], allBlocked, defaultCar, noStress);
    const warning = suggestions.find(
      (s) => s.actionType === 'warning' && s.assignedTo === 'mother',
    );
    expect(warning).toBeDefined();
    expect(warning!.priority).toBe('high');
  });

  it('generates stress mode suggestions when active', () => {
    const tasks: Task[] = [
      {
        id: 'opt-task',
        title: 'Optional chore',
        type: 'recurring',
        category: 'household',
        effort: 'light',
        durationMinutes: 15,
        assignedTo: 'mother',
        fairnessPoints: 2,
      },
    ];
    const stress: StressMode = {
      active: true,
      activatedBy: 'mother',
      reason: 'deadline',
    };
    const suggestions = generateDailySuggestions(1, tasks, mondayBlocks, defaultCar, stress);
    const stressSuggestion = suggestions.find((s) => s.title === 'Stress-Modus aktiv');
    expect(stressSuggestion).toBeDefined();
    expect(stressSuggestion!.priority).toBe('urgent');
    expect(stressSuggestion!.assignedTo).toBe('father'); // other member should help
  });

  it('does NOT generate stress suggestion when stress mode is inactive', () => {
    const tasks: Task[] = [
      {
        id: 'opt-task',
        title: 'Optional chore',
        type: 'recurring',
        category: 'household',
        effort: 'light',
        durationMinutes: 15,
        assignedTo: 'mother',
        fairnessPoints: 2,
      },
    ];
    const suggestions = generateDailySuggestions(1, tasks, mondayBlocks, defaultCar, noStress);
    const stressSuggestion = suggestions.find((s) => s.title === 'Stress-Modus aktiv');
    expect(stressSuggestion).toBeUndefined();
  });

  it('generates meal planning reminder when no food task exists', () => {
    const suggestions = generateDailySuggestions(1, [], mondayBlocks, defaultCar, noStress);
    const mealReminder = suggestions.find((s) => s.title === 'Essen planen');
    expect(mealReminder).toBeDefined();
  });

  it('suppresses meal reminder when a food task exists', () => {
    const foodTask: Task[] = [
      {
        id: 'food-task',
        title: 'Cook dinner',
        type: 'recurring',
        category: 'food',
        effort: 'moderate',
        durationMinutes: 30,
        fairnessPoints: 3,
      },
    ];
    const suggestions = generateDailySuggestions(1, foodTask, mondayBlocks, defaultCar, noStress);
    const mealReminder = suggestions.find((s) => s.title === 'Essen planen');
    expect(mealReminder).toBeUndefined();
  });
});
