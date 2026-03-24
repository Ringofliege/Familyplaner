import type {
  Meal,
  MealPlanEntry,
  DayOfWeek,
  TimeBlock,
} from '../models/types';
import { getDayLoad } from './energy';

// ---------------------------------------------------------------------------
// suggestMeal
// ---------------------------------------------------------------------------

/**
 * Suggest up to 3 meals that fit the available cooking time and the day's
 * energy profile.
 *
 * Filtering:
 * - Total time (prep + cook) must be ≤ `availableTime`.
 * - Recently used meals (last 7 entries in `recentMeals`) are excluded.
 *
 * Sorting:
 * - On a busy day (many blocked slots) → prefer easy meals.
 * - On a free day → allow more complex meals.
 *
 * @param day           Day of the week.
 * @param _mealType     Lunch or dinner (reserved for future filtering).
 * @param availableTime Maximum total minutes available for meal prep + cooking.
 * @param blocks        Pre-computed time blocks (used to gauge day busyness).
 * @param recentMeals   Meal IDs used in the last 7 days.
 * @param allMeals      The full catalogue of known meals.
 * @returns Up to 3 {@link Meal} suggestions, best match first.
 */
export function suggestMeal(
  day: DayOfWeek,
  _mealType: 'lunch' | 'dinner',
  availableTime: number,
  blocks: TimeBlock[],
  recentMeals: string[],
  allMeals: Meal[] = [],
): Meal[] {
  if (allMeals.length === 0) return [];

  // Filter by time budget and freshness
  const recentSet = new Set(recentMeals);
  const candidates = allMeals.filter((meal) => {
    const totalTime = meal.prepTimeMinutes + meal.cookTimeMinutes;
    return totalTime <= availableTime && !recentSet.has(meal.id);
  });

  if (candidates.length === 0) return [];

  // Determine day busyness – average across both members
  const motherLoad = getDayLoad(day, 'mother', blocks);
  const fatherLoad = getDayLoad(day, 'father', blocks);
  const totalSlots = motherLoad.blocked + motherLoad.limited + motherLoad.free;
  const avgBlockedRatio =
    totalSlots === 0
      ? 0
      : (motherLoad.blocked + fatherLoad.blocked) /
        (2 * totalSlots);

  // Difficulty score mapping (lower is better on busy days)
  const difficultyScore: Record<string, number> = {
    easy: 1,
    medium: 2,
    complex: 3,
  };

  // Sort: on busy days prefer easy; on free days allow complex
  const sorted = [...candidates].sort((a, b) => {
    const aScore = difficultyScore[a.difficulty] ?? 2;
    const bScore = difficultyScore[b.difficulty] ?? 2;

    if (avgBlockedRatio > 0.5) {
      // Busy day → easy first
      return aScore - bScore;
    }
    // Free day → complex is fine, but still sort by total time ascending
    if (aScore !== bScore) return aScore - bScore;
    return (
      a.prepTimeMinutes + a.cookTimeMinutes - (b.prepTimeMinutes + b.cookTimeMinutes)
    );
  });

  return sorted.slice(0, 3);
}

// ---------------------------------------------------------------------------
// getMealPlanForWeek
// ---------------------------------------------------------------------------

/**
 * Group a flat list of {@link MealPlanEntry} records by date so the UI can
 * render a weekly overview.
 *
 * @param _startDate ISO date string for the start of the week (used for
 *                   documentation / future filtering; all entries are included).
 * @param entries    The raw meal-plan entries.
 * @returns A `Map<date, MealPlanEntry[]>` keyed by ISO date strings.
 */
export function getMealPlanForWeek(
  _startDate: string,
  entries: MealPlanEntry[],
): Map<string, MealPlanEntry[]> {
  const map = new Map<string, MealPlanEntry[]>();

  for (const entry of entries) {
    const existing = map.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      map.set(entry.date, [entry]);
    }
  }

  return map;
}
