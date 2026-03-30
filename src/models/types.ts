// Family Member
export type FamilyMemberId = 'mother' | 'father';

export interface FamilyMember {
  id: FamilyMemberId;
  name: string;
  color: string;
}

// Time & Schedule
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun=0, Mon=1, ..., Sat=6

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;
}

export interface WorkSchedule {
  day: DayOfWeek;
  slot: TimeSlot;
  isOffice: boolean; // requires commute
  commuteMinutes: number;
}

// Energy & Load
export type SlotStatus = 'free' | 'limited' | 'blocked';

export interface TimeBlock {
  day: DayOfWeek;
  slot: TimeSlot;
  status: SlotStatus;
  owner: FamilyMemberId;
  reason: string; // e.g. 'work', 'commute', 'childcare', 'judo', 'gaming'
}

// Tasks
export type TaskType = 'recurring' | 'one-time' | 'project' | 'mental-load';
export type TaskCategory = 'childcare' | 'household' | 'pets' | 'food' | 'admin' | 'personal' | 'garden';
export type EffortLevel = 'passive' | 'light' | 'moderate' | 'heavy';
export type RecurrencePattern = 'daily' | 'weekday' | 'weekly' | 'biweekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  category: TaskCategory;
  effort: EffortLevel;
  durationMinutes: number;
  assignedTo?: FamilyMemberId;
  preferredAssignee?: FamilyMemberId;
  recurrence?: RecurrencePattern;
  recurrenceDays?: DayOfWeek[];
  preferredTimeSlot?: TimeSlot;
  dependsOn?: string[]; // task IDs
  fairnessPoints: number;
  completed?: boolean;
  completedBy?: FamilyMemberId;
  completedAt?: string;
  dueDate?: string;
}

// Fairness
export interface FairnessScore {
  memberId: FamilyMemberId;
  childcare: number;
  household: number;
  mentalLoad: number;
  pets: number;
  total: number;
}

export interface FairnessRecord {
  date: string; // ISO date
  taskId: string;
  memberId: FamilyMemberId;
  category: TaskCategory;
  points: number;
}

// Calendar Events
export interface CalendarEvent {
  id: string;
  title: string;
  day: DayOfWeek;
  slot: TimeSlot;
  owner: FamilyMemberId | 'family' | 'household';
  isRecurring: boolean;
  color?: string;
  type: 'work' | 'childcare' | 'activity' | 'household' | 'personal';
}

// Meals
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealDifficulty = 'easy' | 'medium' | 'complex';

export interface Meal {
  id: string;
  name: string;
  difficulty: MealDifficulty;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  tags: string[];
  cookidooId?: string; // placeholder for Cookidoo integration
  ingredients?: string[];
}

export interface MealPlanEntry {
  date: string; // ISO date
  mealType: MealType;
  mealId?: string;
  assignedTo?: FamilyMemberId;
  notes?: string;
}

// Resources
export type ResourceType = 'car' | 'cash';

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  status: 'available' | 'in-use' | 'needs-attention';
  metadata: Record<string, unknown>;
}

export interface CarResource extends Resource {
  type: 'car';
  metadata: {
    chargeLevel: number; // 0-100
    needsChargeBefore: DayOfWeek[]; // days that need full charge
    isAvailable: boolean;
  };
}

// Automation / Suggestions
export type SuggestionPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: SuggestionPriority;
  assignedTo: FamilyMemberId;
  relatedTaskId?: string;
  actionType: 'reminder' | 'assignment' | 'warning' | 'suggestion';
  dismissed: boolean;
}

// Interactions
export interface ThankYou {
  id: string;
  from: FamilyMemberId;
  to: FamilyMemberId;
  taskId?: string;
  message?: string;
  date: string;
}

export interface TakeOver {
  id: string;
  taskId: string;
  from: FamilyMemberId;
  to: FamilyMemberId;
  date: string;
}

// App State
export interface StressMode {
  active: boolean;
  activatedBy?: FamilyMemberId;
  reason?: string;
  startDate?: string;
  endDate?: string;
}

// Weekly Review
export interface WeeklyReview {
  weekStart: string;
  fairness: {
    mother: FairnessScore;
    father: FairnessScore;
  };
  totalTasksCompleted: number;
  thankYous: ThankYou[];
  takeOvers: TakeOver[];
  highlights: string[];
}
