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

/** Effort → base point mapping. */
const EFFORT_BASE: Record<string, number> = {
  passive: 1,
  light: 2,
  moderate: 3,
  heavy: 5,
};

/**
 * Calculate the fairness points a single task is worth.
 *
 * Formula:
 * - Start with the effort base (passive=1, light=2, moderate=3, heavy=5).
 * - Apply a ×1.5 multiplier for mental-load type tasks.
 * - Apply a ×1.5 multiplier for childcare category.
 * - Add +1 for every full 30 minutes of duration above 15 min.
 *
 * @param task The task to score.
 * @returns A numeric fairness-point value (≥ 1).
 */
export function calculatePoints(task: Task): number {
  let points = EFFORT_BASE[task.effort] ?? 1;

  // Mental-load multiplier
  if (task.type === 'mental-load') {
    points *= 1.5;
  }

  // Childcare multiplier
  if (task.category === 'childcare') {
    points *= 1.5;
  }

  // Duration bonus: +1 per 30-min block above the first 15 min
  if (task.durationMinutes > 15) {
    points += Math.floor((task.durationMinutes - 15) / 30);
  }

  return Math.max(1, Math.round(points * 100) / 100);
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
 * @returns A {@link FairnessScore} with per-category and total points.
 */
export function calculateFairnessScore(records: FairnessRecord[]): FairnessScore {
  if (records.length === 0) {
    return {
      memberId: 'mother',
      childcare: 0,
      household: 0,
      mentalLoad: 0,
      pets: 0,
      total: 0,
    };
  }

  const memberId = records[0].memberId;
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
    memberId,
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

  const mother = calculateFairnessScore(motherRecords);
  const father = calculateFairnessScore(fatherRecords);

  return {
    mother,
    father,
    balance: getFairnessBalance(mother, father),
  };
}
