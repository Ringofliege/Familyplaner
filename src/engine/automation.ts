import type {
  Suggestion,
  Task,
  DayOfWeek,
  TimeBlock,
  FamilyMemberId,
  CarResource,
  StressMode,
  CalendarEvent,
} from '../models/types';
import { getDayLoad } from './energy';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let suggestionCounter = 0;

/** Create a unique suggestion id using counter + timestamp + random suffix. */
function nextId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `suggestion-${++suggestionCounter}-${Date.now()}-${random}`;
}

// ---------------------------------------------------------------------------
// generateDailySuggestions
// ---------------------------------------------------------------------------

/**
 * Analyse the day's schedule, tasks, resources and stress state and produce
 * a list of actionable suggestions for the family.
 *
 * The engine checks for:
 * 1. **Car charging** – Mon/Tue when charge < 80 %.
 * 2. **Cleaning-lady cash** – Tuesday reminder for Wednesday.
 * 3. **High-load warning** – member with > 6 h blocked.
 * 4. **Task redistribution** – if one member has ≥ 3× more tasks.
 * 5. **Meal reminder** – no meal planned for tomorrow (tasks list heuristic).
 * 6. **Training prep** – if tomorrow includes judo.
 * 7. **Stress-mode adjustments** – suggest dropping non-essential tasks.
 *
 * @param day          Current day of the week.
 * @param tasks        Tasks scheduled for today.
 * @param blocks       Pre-computed time blocks for both members.
 * @param carResource  Current car/EV resource state.
 * @param stressMode   Current stress-mode configuration.
 * @returns An array of {@link Suggestion} items (may be empty).
 */
export function generateDailySuggestions(
  day: DayOfWeek,
  tasks: Task[],
  blocks: TimeBlock[],
  carResource: CarResource,
  stressMode: StressMode,
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // 1. Car charging reminder (Mon=1 or Tue=2)
  if (
    (day === 1 || day === 2) &&
    carResource.metadata.chargeLevel < 80
  ) {
    suggestions.push({
      id: nextId(),
      title: 'Auto laden',
      description: `Ladestand ist bei ${carResource.metadata.chargeLevel} %. Bitte vor Mittwoch aufladen.`,
      priority: 'high',
      assignedTo: 'father',
      actionType: 'reminder',
      dismissed: false,
    });
  }

  // 2. Cleaning-lady cash (Tuesday → prepare for Wednesday)
  if (day === 2) {
    suggestions.push({
      id: nextId(),
      title: 'Bargeld für Putzfrau',
      description: 'Bargeld für die Putzfrau am Mittwoch bereitlegen.',
      priority: 'medium',
      assignedTo: 'mother',
      actionType: 'reminder',
      dismissed: false,
    });
  }

  // 3. High-load warning (> 6 h = 12 slots blocked)
  const HIGH_LOAD_THRESHOLD = 12;
  for (const member of ['mother', 'father'] as FamilyMemberId[]) {
    const load = getDayLoad(day, member, blocks);
    if (load.blocked > HIGH_LOAD_THRESHOLD) {
      suggestions.push({
        id: nextId(),
        title: `Hohe Belastung: ${member === 'mother' ? 'Mama' : 'Papa'}`,
        description: `${member === 'mother' ? 'Mama' : 'Papa'} hat über 6 Stunden geblockt. Optionale Aufgaben reduzieren?`,
        priority: 'high',
        assignedTo: member,
        actionType: 'warning',
        dismissed: false,
      });
    }
  }

  // 4. Task redistribution (one member has 3× more tasks)
  const motherTasks = tasks.filter(
    (t) => t.assignedTo === 'mother' || t.preferredAssignee === 'mother',
  ).length;
  const fatherTasks = tasks.filter(
    (t) => t.assignedTo === 'father' || t.preferredAssignee === 'father',
  ).length;

  if (motherTasks > 0 && fatherTasks > 0) {
    const ratio = Math.max(motherTasks, fatherTasks) / Math.min(motherTasks, fatherTasks);
    if (ratio >= 3) {
      const overloaded: FamilyMemberId = motherTasks > fatherTasks ? 'mother' : 'father';
      const other: FamilyMemberId = overloaded === 'mother' ? 'father' : 'mother';
      suggestions.push({
        id: nextId(),
        title: 'Aufgaben umverteilen',
        description: `${overloaded === 'mother' ? 'Mama' : 'Papa'} hat deutlich mehr Aufgaben. ${other === 'mother' ? 'Mama' : 'Papa'} könnte Aufgaben übernehmen.`,
        priority: 'medium',
        assignedTo: other,
        actionType: 'suggestion',
        dismissed: false,
      });
    }
  }

  // 5. Meal reminder – simple heuristic: if no food-category task exists
  const hasMealTask = tasks.some((t) => t.category === 'food');
  if (!hasMealTask) {
    suggestions.push({
      id: nextId(),
      title: 'Essen planen',
      description: 'Für morgen ist noch kein Essen geplant. Jetzt Mahlzeit auswählen?',
      priority: 'low',
      assignedTo: 'mother',
      actionType: 'suggestion',
      dismissed: false,
    });
  }

  // 6. Training prep – if tomorrow has judo (Tue=2 or Fri=5)
  const tomorrow: DayOfWeek = ((day + 1) % 7) as DayOfWeek;
  if (tomorrow === 2 || tomorrow === 5) {
    suggestions.push({
      id: nextId(),
      title: 'Trainingsvorbereitung',
      description: `Morgen ist Judo-Training. Material und Übungen vorbereiten.`,
      priority: 'medium',
      assignedTo: 'mother',
      actionType: 'reminder',
      dismissed: false,
    });
  }

  // 7. Stress-mode adjustments
  if (stressMode.active && stressMode.activatedBy) {
    const stressed = stressMode.activatedBy;
    const nonEssential = tasks.filter(
      (t) =>
        (t.assignedTo === stressed || t.preferredAssignee === stressed) &&
        t.category !== 'childcare' &&
        t.effort !== 'heavy',
    );
    if (nonEssential.length > 0) {
      suggestions.push({
        id: nextId(),
        title: 'Stress-Modus aktiv',
        description: `${stressed === 'mother' ? 'Mama' : 'Papa'} ist im Stress-Modus. ${nonEssential.length} nicht-essentielle Aufgabe(n) könnten verschoben werden.`,
        priority: 'urgent',
        assignedTo: stressed === 'mother' ? 'father' : 'mother',
        actionType: 'suggestion',
        dismissed: false,
      });
    }
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// generateReminders
// ---------------------------------------------------------------------------

/**
 * Generate time-based reminders for upcoming events and tasks.
 *
 * @param day    Current day of the week.
 * @param tasks  Tasks scheduled for today.
 * @param events Calendar events for today.
 * @returns An array of reminder {@link Suggestion} items.
 */
export function generateReminders(
  day: DayOfWeek,
  tasks: Task[],
  events: CalendarEvent[],
): Suggestion[] {
  const reminders: Suggestion[] = [];

  // Remind about events that belong to a specific member
  const todayEvents = events.filter((e) => e.day === day);
  for (const ev of todayEvents) {
    if (ev.owner === 'household' || ev.owner === 'family') continue;

    reminders.push({
      id: nextId(),
      title: `Erinnerung: ${ev.title}`,
      description: `Heute ${ev.slot.start} – ${ev.slot.end}`,
      priority: 'medium',
      assignedTo: ev.owner,
      actionType: 'reminder',
      dismissed: false,
      relatedTaskId: ev.id,
    });
  }

  // Remind about tasks with a preferred time slot
  for (const task of tasks) {
    if (!task.preferredTimeSlot) continue;
    const assignee = task.assignedTo ?? task.preferredAssignee ?? 'mother';

    reminders.push({
      id: nextId(),
      title: `Aufgabe: ${task.title}`,
      description: `Geplant ${task.preferredTimeSlot.start} – ${task.preferredTimeSlot.end}`,
      priority: 'low',
      assignedTo: assignee,
      actionType: 'reminder',
      dismissed: false,
      relatedTaskId: task.id,
    });
  }

  return reminders;
}
