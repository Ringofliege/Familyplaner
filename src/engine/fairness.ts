import type {
  FairnessScore,
  FairnessRecord,
  FamilyMemberId,
  Task,
  TaskCategory,
} from '../models/types';

// ---------------------------------------------------------------------------
// calculatePoints
// ---------------------------------------------------------------------------

/** Attention level → base point mapping. */
const ATTENTION_BASE: Record<string, number> = {
  passive: 1,
  light: 2,
  moderate: 4,
  heavy: 6,
};

/** Category multipliers (applied to base). */
const CATEGORY_MULTIPLIER: Record<string, number> = {
  childcare: 2.0,
  pets: 1.2,
  household: 1.0,
  food: 1.3,
  admin: 1.0,
  personal: 0.5,
  garden: 1.0,
};

/** Type multipliers (stacks with category). */
const TYPE_MULTIPLIER: Record<string, number> = {
  'mental-load': 1.5,
  recurring: 1.0,
  'one-time': 1.0,
  project: 1.1,
};

/**
 * Calculate the fairness points a single task is worth.
 *
 * Formula:
 * - Start with the attention base (passive=1, light=2, moderate=4, heavy=6).
 * - Apply a category multiplier (e.g. childcare ×2.0, personal ×0.5).
 * - Apply a type multiplier (e.g. mental-load ×1.5, project ×1.1).
 * - Add a tiered duration bonus (≤15→+0, 16-30→+1, 31-60→+2, 61-120→+4, >120→+6).
 * - Add +1 bonus on high-load days.
 * - Clamp result to [1, 20].
 *
 * @param task The task to score.
 * @param isHighLoadDay Whether the task falls on a high-load day.
 * @returns A numeric fairness-point value in [1, 20].
 */
export function calculatePoints(task: Task, isHighLoadDay = false): number {
  let points = ATTENTION_BASE[task.effort] ?? 1;

  // Category multiplier
  points *= CATEGORY_MULTIPLIER[task.category] ?? 1.0;

  // Type multiplier (mental-load premium stacks)
  points *= TYPE_MULTIPLIER[task.type] ?? 1.0;

  // Duration scaling
  if (task.durationMinutes > 120) points += 6;
  else if (task.durationMinutes > 60) points += 4;
  else if (task.durationMinutes > 30) points += 2;
  else if (task.durationMinutes > 15) points += 1;

  // High-load day bonus
  if (isHighLoadDay) points += 1;

  // Anti-gaming: clamp to [1, 20]
  return Math.min(20, Math.max(1, Math.round(points * 100) / 100));
}

// ---------------------------------------------------------------------------
// calculateFairnessScore
// ---------------------------------------------------------------------------

/**
 * Aggregate a list of {@link FairnessRecord} entries into a single
 * {@link FairnessScore} for one member.
 *
 * Categories are summed into `childcare`, `household`, `mentalLoad`, `pets`,
 * and everything else is folded into `household`.
 *
 * @param records Fairness records (should be pre-filtered for one member).
 * @param memberId Optional member ID for the empty-records case (defaults to first record's memberId).
 * @returns A {@link FairnessScore} with per-category and total points.
 */
export function calculateFairnessScore(
  records: FairnessRecord[],
  memberId?: FamilyMemberId,
): FairnessScore {
  const resolvedMemberId = records[0]?.memberId ?? memberId ?? 'mother';

  if (records.length === 0) {
    return {
      memberId: resolvedMemberId,
      childcare: 0,
      household: 0,
      mentalLoad: 0,
      pets: 0,
      total: 0,
    };
  }
  let childcare = 0;
  let household = 0;
  let mentalLoad = 0;
  let pets = 0;

  for (const r of records) {
    switch (r.category as TaskCategory) {
      case 'childcare':
        childcare += r.points;
        break;
      case 'pets':
        pets += r.points;
        break;
      case 'admin':
        mentalLoad += r.points;
        break;
      case 'household':
      case 'food':
      case 'personal':
      case 'garden':
      default:
        household += r.points;
        break;
    }
  }

  return {
    memberId: resolvedMemberId,
    childcare,
    household,
    mentalLoad,
    pets,
    total: childcare + household + mentalLoad + pets,
  };
}

// ---------------------------------------------------------------------------
// getFairnessBalance
// ---------------------------------------------------------------------------

/**
 * Compute the balance between two members' fairness scores.
 *
 * - `ratio` is always ≥ 1 (the larger total divided by the smaller).
 * - If `ratio < 1.1` the workload is considered `'balanced'`.
 * - `imbalancePercent` shows how far off a perfect 50/50 split the scores are.
 *
 * @param mother Mother's aggregated score.
 * @param father Father's aggregated score.
 */
export function getFairnessBalance(
  mother: FairnessScore,
  father: FairnessScore,
): {
  ratio: number;
  advantageMember: FamilyMemberId | 'balanced';
  imbalancePercent: number;
} {
  const mTotal = mother.total;
  const fTotal = father.total;

  // Guard against division by zero
  if (mTotal === 0 && fTotal === 0) {
    return { ratio: 1, advantageMember: 'balanced', imbalancePercent: 0 };
  }

  const max = Math.max(mTotal, fTotal);
  const min = Math.min(mTotal, fTotal);
  const ratio = min === 0 ? max : Math.round((max / min) * 100) / 100;

  const total = mTotal + fTotal;
  const imbalancePercent =
    total === 0
      ? 0
      : Math.round(Math.abs(mTotal / total - 0.5) * 200 * 100) / 100;

  let advantageMember: FamilyMemberId | 'balanced';
  if (ratio < 1.1) {
    advantageMember = 'balanced';
  } else {
    // The member doing LESS work has the "advantage" (less burdened)
    advantageMember = mTotal < fTotal ? 'mother' : 'father';
  }

  return { ratio, advantageMember, imbalancePercent };
}

// ---------------------------------------------------------------------------
// getWeeklyFairnessSummary
// ---------------------------------------------------------------------------

/**
 * Produce a weekly fairness summary from a list of records covering one week.
 *
 * @param records All {@link FairnessRecord} entries for the week (both members).
 * @returns Aggregated scores for each member plus the balance analysis.
 */
export function getWeeklyFairnessSummary(
  records: FairnessRecord[],
): {
  mother: FairnessScore;
  father: FairnessScore;
  balance: ReturnType<typeof getFairnessBalance>;
} {
  const motherRecords = records.filter((r) => r.memberId === 'mother');
  const fatherRecords = records.filter((r) => r.memberId === 'father');

  const mother = calculateFairnessScore(motherRecords, 'mother');
  const father = calculateFairnessScore(fatherRecords, 'father');

  return {
    mother,
    father,
    balance: getFairnessBalance(mother, father),
  };
}
