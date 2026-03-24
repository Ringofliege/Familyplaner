import type {
  Task,
  FamilyMemberId,
  DayOfWeek,
  TimeBlock,
} from '../models/types';
import { getDayLoad } from './energy';

// ---------------------------------------------------------------------------
// Core: assignResponsibility
// ---------------------------------------------------------------------------

/**
 * Decide which family member should handle a given task on a specific day.
 *
 * Resolution order:
 * 1. Fixed assignment (`task.assignedTo`) → return immediately.
 * 2. Preferred assignee available → prefer them.
 * 3. More free time on this day → assign to the less-loaded member.
 * 4. Similar availability → assign to the member with fewer fairness points
 *    (balances the overall workload).
 * 5. Childcare logistics defaults (father brings, mother picks up; Wednesday
 *    is swapped).
 * 6. Stress-mode reduction — if a stress flag is provided for a member, they
 *    receive lower priority.
 *
 * @returns The chosen {@link FamilyMemberId}, or `null` when both members are
 *          fully blocked at the task's preferred time and rescheduling is
 *          recommended.
 */
export function assignResponsibility(
  task: Task,
  day: DayOfWeek,
  motherBlocks: TimeBlock[],
  fatherBlocks: TimeBlock[],
  fairnessScores: { mother: number; father: number },
  stressedMember?: FamilyMemberId | null,
): FamilyMemberId | null {
  // 1. Fixed assignment
  if (task.assignedTo) {
    return task.assignedTo;
  }

  const allBlocks = [...motherBlocks, ...fatherBlocks];
  const motherLoad = getDayLoad(day, 'mother', allBlocks);
  const fatherLoad = getDayLoad(day, 'father', allBlocks);

  const motherFree = motherLoad.free + motherLoad.limited * 0.5;
  const fatherFree = fatherLoad.free + fatherLoad.limited * 0.5;

  // Both fully blocked → suggest rescheduling
  if (motherFree === 0 && fatherFree === 0) {
    return null;
  }

  // 2. Preferred assignee
  if (task.preferredAssignee) {
    const prefFree = task.preferredAssignee === 'mother' ? motherFree : fatherFree;
    if (prefFree > 0) {
      // Yield to stress-mode override
      if (stressedMember && stressedMember === task.preferredAssignee) {
        const otherFree = task.preferredAssignee === 'mother' ? fatherFree : motherFree;
        if (otherFree > 0) {
          return task.preferredAssignee === 'mother' ? 'father' : 'mother';
        }
      }
      return task.preferredAssignee;
    }
  }

  // 5. Childcare logistics defaults
  if (task.category === 'childcare') {
    return resolveChildcareDefault(task, day, motherFree, fatherFree);
  }

  // 6. Stress-mode: de-prioritise stressed member
  if (stressedMember) {
    const otherFree = stressedMember === 'mother' ? fatherFree : motherFree;
    if (otherFree > 0) {
      return stressedMember === 'mother' ? 'father' : 'mother';
    }
  }

  // 3. More free time → less loaded person
  const FREE_DIFF_THRESHOLD = 1; // at least 1 effective-slot difference
  if (motherFree - fatherFree >= FREE_DIFF_THRESHOLD) {
    return 'mother';
  }
  if (fatherFree - motherFree >= FREE_DIFF_THRESHOLD) {
    return 'father';
  }

  // 4. Similar availability → balance fairness
  if (fairnessScores.mother <= fairnessScores.father) {
    return 'mother';
  }
  return 'father';
}

// ---------------------------------------------------------------------------
// resolveConflicts
// ---------------------------------------------------------------------------

/**
 * Re-order and (if necessary) re-assign a list of tasks so that no single
 * member is overloaded on the given day.
 *
 * The algorithm:
 * 1. Sort tasks by effort (heaviest first) so high-effort work is placed while
 *    there is still capacity.
 * 2. Walk through the sorted list, greedily assigning to the member with more
 *    remaining capacity.
 * 3. Respect fixed assignments (`assignedTo`) – those are never changed.
 *
 * @param tasks  The full task list for the day.
 * @param day    The day of the week.
 * @param blocks Pre-computed time blocks for both members.
 * @returns A new array of tasks with `assignedTo` populated.
 */
export function resolveConflicts(
  tasks: Task[],
  day: DayOfWeek,
  blocks: TimeBlock[],
): Task[] {
  if (tasks.length === 0) return [];

  const effortOrder: Record<string, number> = { heavy: 0, moderate: 1, light: 2, passive: 3 };
  const sorted = [...tasks].sort(
    (a, b) => (effortOrder[a.effort] ?? 3) - (effortOrder[b.effort] ?? 3),
  );

  const motherLoad = getDayLoad(day, 'mother', blocks);
  const fatherLoad = getDayLoad(day, 'father', blocks);
  let motherRemaining = motherLoad.free + motherLoad.limited * 0.5;
  let fatherRemaining = fatherLoad.free + fatherLoad.limited * 0.5;

  const result: Task[] = [];

  for (const task of sorted) {
    const slotCost = task.durationMinutes / 30; // how many 30-min slots

    if (task.assignedTo) {
      // Fixed – just deduct capacity
      if (task.assignedTo === 'mother') motherRemaining -= slotCost;
      else fatherRemaining -= slotCost;
      result.push(task);
      continue;
    }

    // Assign to whoever has more capacity
    const assignee: FamilyMemberId =
      motherRemaining >= fatherRemaining ? 'mother' : 'father';

    if (assignee === 'mother') motherRemaining -= slotCost;
    else fatherRemaining -= slotCost;

    result.push({ ...task, assignedTo: assignee });
  }

  return result;
}

// ---------------------------------------------------------------------------
// getResponsibleToday
// ---------------------------------------------------------------------------

/**
 * For every task on a given day, determine the responsible family member.
 *
 * @param day       The day of the week.
 * @param tasks     All tasks that apply to this day.
 * @param blocks    Pre-computed time blocks for both members.
 * @param fairness  Current cumulative fairness scores.
 * @returns A `Map<taskId, FamilyMemberId>` for each task.
 */
export function getResponsibleToday(
  day: DayOfWeek,
  tasks: Task[],
  blocks: TimeBlock[],
  fairness: { mother: number; father: number },
): Map<string, FamilyMemberId> {
  const result = new Map<string, FamilyMemberId>();
  if (tasks.length === 0) return result;

  const motherBlocks = blocks.filter((b) => b.owner === 'mother');
  const fatherBlocks = blocks.filter((b) => b.owner === 'father');

  for (const task of tasks) {
    const responsible = assignResponsibility(
      task,
      day,
      motherBlocks,
      fatherBlocks,
      fairness,
    );
    if (responsible) {
      result.set(task.id, responsible);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Apply the child logistics convention:
 * - Father brings (drop-off) by default; mother picks up.
 * - **Wednesday exception**: roles are swapped.
 * - If the default assignee has no capacity, fall back to the other parent.
 */
function resolveChildcareDefault(
  task: Task,
  day: DayOfWeek,
  motherFree: number,
  fatherFree: number,
): FamilyMemberId {
  const isWednesday = day === 3;
  const isDropoff = task.title.toLowerCase().includes('bring');

  let primary: FamilyMemberId;
  if (isDropoff) {
    primary = isWednesday ? 'mother' : 'father';
  } else {
    primary = isWednesday ? 'father' : 'mother';
  }

  const primaryFree = primary === 'mother' ? motherFree : fatherFree;
  if (primaryFree > 0) return primary;

  // Fall back
  return primary === 'mother' ? 'father' : 'mother';
}
