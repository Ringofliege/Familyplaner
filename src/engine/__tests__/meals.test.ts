import { describe, it, expect } from 'vitest';
import { suggestMeal, getMealPlanForWeek } from '../meals';
import { calculateTimeBlocks } from '../energy';
import type { MealPlanEntry, TimeBlock, WorkSchedule } from '../../models/types';
import { sampleMeals } from '../../data/meals';
import {
  motherWorkSchedule,
  fatherWorkSchedule,
  allFixedEvents,
} from '../../data/schedules';

const workSchedules: Record<string, WorkSchedule[]> = {
  mother: motherWorkSchedule,
  father: fatherWorkSchedule,
};

const mondayBlocks = calculateTimeBlocks(1, workSchedules, allFixedEvents);

describe('suggestMeal', () => {
  it('filters by available time', () => {
    // Only 20 min available → only meals with total time ≤ 20
    const suggestions = suggestMeal(1, 'dinner', 20, mondayBlocks, [], sampleMeals);
    for (const meal of suggestions) {
      expect(meal.prepTimeMinutes + meal.cookTimeMinutes).toBeLessThanOrEqual(20);
    }
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('excludes meals that take too long', () => {
    // Only 10 min → very few or no meals
    const suggestions = suggestMeal(1, 'dinner', 10, mondayBlocks, [], sampleMeals);
    for (const meal of suggestions) {
      expect(meal.prepTimeMinutes + meal.cookTimeMinutes).toBeLessThanOrEqual(10);
    }
  });

  it('excludes recent meals', () => {
    const recentIds = ['meal-1', 'meal-2', 'meal-3', 'meal-4', 'meal-5'];
    const suggestions = suggestMeal(1, 'dinner', 120, mondayBlocks, recentIds, sampleMeals);
    for (const meal of suggestions) {
      expect(recentIds).not.toContain(meal.id);
    }
  });

  it('returns max 3 suggestions', () => {
    const suggestions = suggestMeal(1, 'dinner', 999, mondayBlocks, [], sampleMeals);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it('returns empty array when no meals match', () => {
    const suggestions = suggestMeal(1, 'dinner', 1, mondayBlocks, [], sampleMeals);
    expect(suggestions).toEqual([]);
  });

  it('returns empty array when allMeals is empty', () => {
    const suggestions = suggestMeal(1, 'dinner', 120, mondayBlocks, [], []);
    expect(suggestions).toEqual([]);
  });

  it('returns empty when all meals are in recentMeals', () => {
    const allIds = sampleMeals.map((m) => m.id);
    const suggestions = suggestMeal(1, 'dinner', 999, mondayBlocks, allIds, sampleMeals);
    expect(suggestions).toEqual([]);
  });

  it('prefers easier meals on busy days', () => {
    // Create very busy day blocks (all slots blocked)
    const busyBlocks: TimeBlock[] = [];
    for (let m = 6 * 60; m < 24 * 60; m += 30) {
      const start = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const end = `${String(Math.floor((m + 30) / 60)).padStart(2, '0')}:${String((m + 30) % 60).padStart(2, '0')}`;
      for (const owner of ['mother', 'father'] as const) {
        busyBlocks.push({
          day: 1,
          slot: { start, end },
          status: 'blocked',
          owner,
          reason: 'work',
        });
      }
    }
    const suggestions = suggestMeal(1, 'dinner', 120, busyBlocks, [], sampleMeals);
    if (suggestions.length >= 2) {
      // First suggestion should be easier or equal difficulty to second
      const diffMap: Record<string, number> = { easy: 1, medium: 2, complex: 3 };
      expect(diffMap[suggestions[0].difficulty]).toBeLessThanOrEqual(
        diffMap[suggestions[1].difficulty],
      );
    }
  });
});

describe('getMealPlanForWeek', () => {
  it('groups entries by date', () => {
    const entries: MealPlanEntry[] = [
      { date: '2025-01-06', mealType: 'lunch', mealId: 'meal-1' },
      { date: '2025-01-06', mealType: 'dinner', mealId: 'meal-2' },
      { date: '2025-01-07', mealType: 'lunch', mealId: 'meal-3' },
    ];
    const plan = getMealPlanForWeek('2025-01-06', entries);
    expect(plan.size).toBe(2);
    expect(plan.get('2025-01-06')!.length).toBe(2);
    expect(plan.get('2025-01-07')!.length).toBe(1);
  });

  it('returns empty map for no entries', () => {
    const plan = getMealPlanForWeek('2025-01-06', []);
    expect(plan.size).toBe(0);
  });

  it('handles single entry per day', () => {
    const entries: MealPlanEntry[] = [
      { date: '2025-01-06', mealType: 'dinner', mealId: 'meal-1' },
      { date: '2025-01-07', mealType: 'dinner', mealId: 'meal-2' },
      { date: '2025-01-08', mealType: 'dinner', mealId: 'meal-3' },
    ];
    const plan = getMealPlanForWeek('2025-01-06', entries);
    expect(plan.size).toBe(3);
    for (const [, dayEntries] of plan) {
      expect(dayEntries.length).toBe(1);
    }
  });

  it('preserves entry data correctly', () => {
    const entry: MealPlanEntry = {
      date: '2025-01-06',
      mealType: 'lunch',
      mealId: 'meal-1',
      assignedTo: 'mother',
      notes: 'Use leftovers',
    };
    const plan = getMealPlanForWeek('2025-01-06', [entry]);
    const dayEntries = plan.get('2025-01-06')!;
    expect(dayEntries[0]).toEqual(entry);
  });
});
