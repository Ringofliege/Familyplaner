import type { Task } from '../models/types';

// Fairness-point scale:
//   passive: 1 | light: 2 | moderate: 3 | heavy: 5 | mental-load: 3
//   childcare category multiplier: ×1.5

export const recurringTasks: Task[] = [
  // --- Laundry ---------------------------------------------------------
  {
    id: 'task-laundry-hang',
    title: 'Wäsche aufhängen',
    type: 'recurring',
    category: 'household',
    effort: 'light',
    durationMinutes: 15,
    recurrence: 'daily',
    fairnessPoints: 2,
  },
  {
    id: 'task-laundry-fold',
    title: 'Wäsche zusammenlegen',
    type: 'recurring',
    category: 'household',
    effort: 'passive',
    durationMinutes: 20,
    preferredAssignee: 'mother',
    recurrence: 'daily',
    dependsOn: ['task-laundry-hang'],
    fairnessPoints: 1,
  },
  {
    id: 'task-laundry-put-away',
    title: 'Wäsche wegräumen',
    type: 'recurring',
    category: 'household',
    effort: 'light',
    durationMinutes: 10,
    assignedTo: 'father',
    recurrence: 'daily',
    dependsOn: ['task-laundry-fold'],
    fairnessPoints: 2,
  },

  // --- Dishwasher ------------------------------------------------------
  {
    id: 'task-dishwasher-unload',
    title: 'Spülmaschine ausräumen',
    type: 'recurring',
    category: 'household',
    effort: 'light',
    durationMinutes: 10,
    recurrence: 'daily',
    fairnessPoints: 2,
  },

  // --- Cats ------------------------------------------------------------
  {
    id: 'task-cat-feeding',
    title: 'Katzen füttern',
    description: 'Morgens und abends',
    type: 'recurring',
    category: 'pets',
    effort: 'light',
    durationMinutes: 5,
    recurrence: 'daily',
    fairnessPoints: 2,
  },
  {
    id: 'task-cat-litter',
    title: 'Katzenklo reinigen',
    type: 'recurring',
    category: 'pets',
    effort: 'moderate',
    durationMinutes: 10,
    recurrence: 'biweekly',
    fairnessPoints: 3,
  },
  {
    id: 'task-cat-supplies',
    title: 'Katzenbedarf prüfen',
    description: 'Futter, Streu, Zubehör checken und ggf. bestellen',
    type: 'mental-load',
    category: 'pets',
    effort: 'passive',
    durationMinutes: 10,
    recurrence: 'weekly',
    fairnessPoints: 3,
  },

  // --- Household admin -------------------------------------------------
  {
    id: 'task-cash-cleaning-lady',
    title: 'Bargeld für Putzfrau bereitlegen',
    type: 'mental-load',
    category: 'admin',
    effort: 'passive',
    durationMinutes: 5,
    recurrence: 'weekly',
    recurrenceDays: [2], // Tuesday
    fairnessPoints: 3,
  },

  // --- Food planning ---------------------------------------------------
  {
    id: 'task-meal-planning',
    title: 'Wochenplan Essen',
    description: 'Mahlzeiten für die Woche planen und Einkaufsliste erstellen',
    type: 'mental-load',
    category: 'food',
    effort: 'passive',
    durationMinutes: 30,
    recurrence: 'weekly',
    recurrenceDays: [0], // Sunday
    fairnessPoints: 3,
  },

  // --- Kindergarten ----------------------------------------------------
  {
    id: 'task-kindergarten-board',
    title: 'Elternbeirat Kindergarten',
    description: 'Organisatorische Aufgaben für den Elternbeirat',
    type: 'mental-load',
    category: 'childcare',
    effort: 'passive',
    durationMinutes: 60,
    assignedTo: 'mother',
    recurrence: 'weekly',
    fairnessPoints: 5, // 3 (mental-load) × 1.5 (childcare) ≈ 5
  },

  // --- Training prep (mental load) ------------------------------------
  {
    id: 'task-training-prep-tue',
    title: 'Trainingsvorbereitung Dienstag',
    description: 'Judo-Training am Dienstag vorbereiten (Übungen planen, Material checken)',
    type: 'mental-load',
    category: 'personal',
    effort: 'passive',
    durationMinutes: 15,
    assignedTo: 'mother',
    recurrence: 'weekly',
    recurrenceDays: [1, 2], // Monday or Tuesday
    fairnessPoints: 3,
  },
  {
    id: 'task-training-prep-fri',
    title: 'Trainingsvorbereitung Freitag',
    description: 'Judo-Training am Freitag vorbereiten (Übungen planen, Material checken)',
    type: 'mental-load',
    category: 'personal',
    effort: 'passive',
    durationMinutes: 15,
    assignedTo: 'mother',
    recurrence: 'weekly',
    recurrenceDays: [4, 5], // Thursday or Friday
    fairnessPoints: 3,
  },
];
