import type { WorkSchedule, CalendarEvent, DayOfWeek } from '../models/types';

// ---------------------------------------------------------------------------
// Work Schedules
// ---------------------------------------------------------------------------

export const motherWorkSchedule: WorkSchedule[] = [
  { day: 1, slot: { start: '08:00', end: '14:00' }, isOffice: false, commuteMinutes: 0 },
  { day: 2, slot: { start: '08:00', end: '12:00' }, isOffice: false, commuteMinutes: 0 },
  { day: 3, slot: { start: '09:00', end: '15:00' }, isOffice: true, commuteMinutes: 60 },
  { day: 4, slot: { start: '08:00', end: '14:00' }, isOffice: false, commuteMinutes: 0 },
  { day: 5, slot: { start: '08:00', end: '14:00' }, isOffice: false, commuteMinutes: 0 },
];

export const fatherWorkSchedule: WorkSchedule[] = [
  { day: 1, slot: { start: '09:00', end: '15:00' }, isOffice: false, commuteMinutes: 0 },
  { day: 2, slot: { start: '09:00', end: '15:00' }, isOffice: false, commuteMinutes: 0 },
  { day: 3, slot: { start: '08:00', end: '12:00' }, isOffice: false, commuteMinutes: 0 },
  { day: 4, slot: { start: '09:00', end: '17:00' }, isOffice: true, commuteMinutes: 60 },
  { day: 5, slot: { start: '09:00', end: '12:00' }, isOffice: false, commuteMinutes: 0 },
];

// ---------------------------------------------------------------------------
// Mother's fixed events
// ---------------------------------------------------------------------------

export const motherFixedEvents: CalendarEvent[] = [
  {
    id: 'event-mother-judo-tue',
    title: 'Judo unterrichten',
    day: 2,
    slot: { start: '16:30', end: '21:00' },
    owner: 'mother',
    isRecurring: true,
    color: '#ec4899',
    type: 'activity',
  },
  {
    id: 'event-mother-judo-fri',
    title: 'Judo unterrichten',
    day: 5,
    slot: { start: '16:30', end: '18:00' },
    owner: 'mother',
    isRecurring: true,
    color: '#ec4899',
    type: 'activity',
  },
  {
    id: 'event-mother-training-wed',
    title: 'Eigenes Training',
    day: 3,
    slot: { start: '18:30', end: '21:30' },
    owner: 'mother',
    isRecurring: true,
    color: '#ec4899',
    type: 'personal',
  },
];

// ---------------------------------------------------------------------------
// Father's fixed events
// ---------------------------------------------------------------------------

export const fatherFixedEvents: CalendarEvent[] = [
  {
    id: 'event-father-gaming-mon',
    title: 'Gaming',
    day: 1,
    slot: { start: '21:00', end: '24:00' },
    owner: 'father',
    isRecurring: true,
    color: '#3b82f6',
    type: 'personal',
  },
  {
    id: 'event-father-gaming-thu',
    title: 'Gaming',
    day: 4,
    slot: { start: '21:00', end: '24:00' },
    owner: 'father',
    isRecurring: true,
    color: '#3b82f6',
    type: 'personal',
  },
];

// ---------------------------------------------------------------------------
// Child logistics (kindergarten drop-off / pick-up)
// ---------------------------------------------------------------------------

const childcareWeekdays: DayOfWeek[] = [1, 2, 3, 4, 5];

export const childLogisticsEvents: CalendarEvent[] = childcareWeekdays.flatMap(
  (day): CalendarEvent[] => {
    const isWednesday = day === 3;
    return [
      {
        id: `event-child-dropoff-${day}`,
        title: 'Kind bringen',
        day,
        slot: { start: '07:30', end: '08:00' },
        owner: isWednesday ? 'mother' : 'father',
        isRecurring: true,
        type: 'childcare',
      },
      {
        id: `event-child-pickup-${day}`,
        title: 'Kind abholen',
        day,
        slot: { start: '14:30', end: '15:00' },
        owner: isWednesday ? 'father' : 'mother',
        isRecurring: true,
        type: 'childcare',
      },
    ];
  },
);

// ---------------------------------------------------------------------------
// Household events
// ---------------------------------------------------------------------------

export const householdEvents: CalendarEvent[] = [
  {
    id: 'event-cleaning-lady-wed',
    title: 'Putzfrau',
    day: 3,
    slot: { start: '09:00', end: '12:00' },
    owner: 'household',
    isRecurring: true,
    type: 'household',
  },
];

// ---------------------------------------------------------------------------
// Aggregated list of all fixed calendar events
// ---------------------------------------------------------------------------

export const allFixedEvents: CalendarEvent[] = [
  ...motherFixedEvents,
  ...fatherFixedEvents,
  ...childLogisticsEvents,
  ...householdEvents,
];
