import type {
  FamilyMemberId,
  DayOfWeek,
  TimeBlock,
  SlotStatus,
  WorkSchedule,
  CalendarEvent,
  TimeSlot,
} from '../models/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert "HH:MM" to minutes since midnight. */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight back to "HH:MM". */
function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Check whether two time ranges overlap. */
function overlaps(a: TimeSlot, b: TimeSlot): boolean {
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

// ---------------------------------------------------------------------------
// Core: calculateTimeBlocks
// ---------------------------------------------------------------------------

/**
 * Break a day into 30-minute slots (06:00 – 24:00) for every family member and
 * classify each slot as `free`, `limited`, or `blocked`.
 *
 * **Blocked** – work hours, commute windows, and fixed events that belong to the
 * member (judo, gaming, childcare logistics, etc.).
 *
 * **Limited** – within 30 min of a blocked slot (transition buffer) or during a
 * childcare-responsibility window where the member is the responsible parent.
 *
 * **Free** – everything else.
 *
 * @param day             The day of the week (0 = Sun … 6 = Sat).
 * @param workSchedules   Per-member work schedules keyed by {@link FamilyMemberId}.
 * @param events          All calendar events for the day.
 * @returns An array of {@link TimeBlock} entries for every member × slot.
 */
export function calculateTimeBlocks(
  day: DayOfWeek,
  workSchedules: Record<FamilyMemberId, WorkSchedule[]>,
  events: CalendarEvent[],
): TimeBlock[] {
  const members: FamilyMemberId[] = ['mother', 'father'];
  const blocks: TimeBlock[] = [];

  for (const member of members) {
    // 1. Generate raw 30-min slots
    const DAY_START = 6 * 60; // 06:00
    const DAY_END = 24 * 60; // 24:00
    const SLOT_SIZE = 30;

    interface RawSlot {
      slot: TimeSlot;
      status: SlotStatus;
      reason: string;
    }

    const rawSlots: RawSlot[] = [];

    for (let m = DAY_START; m < DAY_END; m += SLOT_SIZE) {
      rawSlots.push({
        slot: { start: toTime(m), end: toTime(m + SLOT_SIZE) },
        status: 'free',
        reason: '',
      });
    }

    // 2. Mark blocked slots – work (using per-member schedules)
    const memberWork = (workSchedules[member] ?? []).filter((ws) => ws.day === day);

    for (const ws of memberWork) {
      // Block work hours
      markSlots(rawSlots, ws.slot, 'blocked', 'work');

      // Block commute (before & after work)
      if (ws.isOffice && ws.commuteMinutes > 0) {
        const commuteBefore: TimeSlot = {
          start: toTime(Math.max(DAY_START, toMinutes(ws.slot.start) - ws.commuteMinutes)),
          end: ws.slot.start,
        };
        const commuteAfter: TimeSlot = {
          start: ws.slot.end,
          end: toTime(Math.min(DAY_END, toMinutes(ws.slot.end) + ws.commuteMinutes)),
        };
        markSlots(rawSlots, commuteBefore, 'blocked', 'commute');
        markSlots(rawSlots, commuteAfter, 'blocked', 'commute');
      }
    }

    // 3. Mark blocked slots – events owned by this member
    const memberEvents = events.filter(
      (e) => e.day === day && (e.owner === member || e.owner === 'family'),
    );

    for (const ev of memberEvents) {
      markSlots(rawSlots, ev.slot, 'blocked', ev.type);
    }

    // 4. Mark limited – childcare responsibility windows
    const childcareEvents = events.filter(
      (e) => e.day === day && e.type === 'childcare' && e.owner === member,
    );
    for (const ce of childcareEvents) {
      // The actual event is blocked (already handled above); surrounding slots
      // are limited if not already blocked.
      markSlotsIfFree(rawSlots, ce.slot, 'limited', 'childcare');
    }

    // 5. Mark limited – 30-min transition buffer around every blocked slot
    const blockedIndices = rawSlots
      .map((s, i) => (s.status === 'blocked' ? i : -1))
      .filter((i) => i >= 0);

    for (const idx of blockedIndices) {
      if (idx > 0 && rawSlots[idx - 1].status === 'free') {
        rawSlots[idx - 1].status = 'limited';
        rawSlots[idx - 1].reason = 'transition';
      }
      if (idx < rawSlots.length - 1 && rawSlots[idx + 1].status === 'free') {
        rawSlots[idx + 1].status = 'limited';
        rawSlots[idx + 1].reason = 'transition';
      }
    }

    // 6. Convert to TimeBlock[]
    for (const raw of rawSlots) {
      blocks.push({
        day,
        slot: raw.slot,
        status: raw.status,
        owner: member,
        reason: raw.reason,
      });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Return the free and limited slots for a specific member on a given day.
 *
 * @param day     The day of the week.
 * @param member  The family member to query.
 * @param blocks  Pre-computed time blocks (from {@link calculateTimeBlocks}).
 * @returns An array of {@link TimeSlot} that are not blocked.
 */
export function getAvailableSlots(
  day: DayOfWeek,
  member: FamilyMemberId,
  blocks: TimeBlock[],
): TimeSlot[] {
  return blocks
    .filter((b) => b.day === day && b.owner === member && b.status !== 'blocked')
    .map((b) => b.slot);
}

/**
 * Return the count of blocked / limited / free slots for a member on a day.
 *
 * @param day     The day of the week.
 * @param member  The family member.
 * @param blocks  Pre-computed time blocks.
 * @returns An object with `blocked`, `limited`, and `free` slot counts.
 */
export function getDayLoad(
  day: DayOfWeek,
  member: FamilyMemberId,
  blocks: TimeBlock[],
): { blocked: number; limited: number; free: number } {
  const memberBlocks = blocks.filter((b) => b.day === day && b.owner === member);
  return {
    blocked: memberBlocks.filter((b) => b.status === 'blocked').length,
    limited: memberBlocks.filter((b) => b.status === 'limited').length,
    free: memberBlocks.filter((b) => b.status === 'free').length,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function markSlots(
  slots: { slot: TimeSlot; status: SlotStatus; reason: string }[],
  window: TimeSlot,
  status: SlotStatus,
  reason: string,
): void {
  for (const s of slots) {
    if (overlaps(s.slot, window)) {
      // Only escalate: free → limited → blocked
      if (statusPriority(status) > statusPriority(s.status)) {
        s.status = status;
        s.reason = reason;
      }
    }
  }
}

function markSlotsIfFree(
  slots: { slot: TimeSlot; status: SlotStatus; reason: string }[],
  window: TimeSlot,
  status: SlotStatus,
  reason: string,
): void {
  for (const s of slots) {
    if (overlaps(s.slot, window) && s.status === 'free') {
      s.status = status;
      s.reason = reason;
    }
  }
}

function statusPriority(status: SlotStatus): number {
  switch (status) {
    case 'free':
      return 0;
    case 'limited':
      return 1;
    case 'blocked':
      return 2;
  }
}
