import { describe, it, expect } from 'vitest';
import { calculateTimeBlocks, getDayLoad, getAvailableSlots } from '../energy';
import type { WorkSchedule } from '../../models/types';
import {
  motherWorkSchedule,
  fatherWorkSchedule,
  allFixedEvents,
} from '../../data/schedules';

const workSchedules: Record<string, WorkSchedule[]> = {
  mother: motherWorkSchedule,
  father: fatherWorkSchedule,
};

// Monday = 1
const mondayBlocks = calculateTimeBlocks(1, workSchedules, allFixedEvents);

describe('calculateTimeBlocks', () => {
  it('returns blocks for both members covering 06:00–24:00 in 30-min slots', () => {
    const slotsPerMember = (24 - 6) * 2; // 36 slots
    // Two members → 72 blocks total
    expect(mondayBlocks).toHaveLength(slotsPerMember * 2);
  });

  it('marks work hours as blocked on Monday', () => {
    // Mother works 08:00–14:00 on Monday
    const motherWork = mondayBlocks.filter(
      (b) =>
        b.owner === 'mother' &&
        b.status === 'blocked' &&
        b.reason === 'work',
    );
    // 08:00–14:00 = 12 half-hour slots
    expect(motherWork.length).toBe(12);

    // Father works 09:00–15:00 on Monday
    const fatherWork = mondayBlocks.filter(
      (b) =>
        b.owner === 'father' &&
        b.status === 'blocked' &&
        b.reason === 'work',
    );
    expect(fatherWork.length).toBe(12);
  });

  it('extends blocked period with commute on office days (Wed for mother)', () => {
    const wedBlocks = calculateTimeBlocks(3, workSchedules, allFixedEvents);

    // Mother: office Wed 09:00–15:00, commute 60 min
    // Commute before: 08:00–09:00 (2 slots), commute after: 15:00–16:00 (2 slots)
    const motherCommute = wedBlocks.filter(
      (b) =>
        b.owner === 'mother' &&
        b.status === 'blocked' &&
        b.reason === 'commute',
    );
    expect(motherCommute.length).toBe(4); // 2 before + 2 after
  });

  it('extends blocked period with commute on office days (Thu for father)', () => {
    const thuBlocks = calculateTimeBlocks(4, workSchedules, allFixedEvents);

    // Father: office Thu 09:00–17:00, commute 60 min
    // Commute before: 08:00–09:00 (2 slots), commute after: 17:00–18:00 (2 slots)
    const fatherCommute = thuBlocks.filter(
      (b) =>
        b.owner === 'father' &&
        b.status === 'blocked' &&
        b.reason === 'commute',
    );
    expect(fatherCommute.length).toBe(4);
  });

  it('marks fixed events (judo, gaming) as blocked', () => {
    // Father gaming on Monday 21:00–24:00 → 6 slots blocked
    const fatherGaming = mondayBlocks.filter(
      (b) =>
        b.owner === 'father' &&
        b.status === 'blocked' &&
        b.reason === 'personal',
    );
    expect(fatherGaming.length).toBe(6);

    // Mother judo on Tuesday 16:30–21:00 → 9 slots (overlapping 30-min windows)
    const tueBlocks = calculateTimeBlocks(2, workSchedules, allFixedEvents);
    const motherJudo = tueBlocks.filter(
      (b) =>
        b.owner === 'mother' &&
        b.status === 'blocked' &&
        b.reason === 'activity',
    );
    expect(motherJudo.length).toBe(9);
  });

  it('marks childcare logistics events as blocked for their owners', () => {
    // On Monday, father has "Kind bringen" 07:30–08:00 → blocked for father
    const fatherDropoff = mondayBlocks.filter(
      (b) =>
        b.owner === 'father' &&
        b.status === 'blocked' &&
        b.reason === 'childcare',
    );
    expect(fatherDropoff.length).toBeGreaterThanOrEqual(1);

    // On Monday, mother has "Kind abholen" 14:30–15:00 → blocked for mother
    const motherPickup = mondayBlocks.filter(
      (b) =>
        b.owner === 'mother' &&
        b.status === 'blocked' &&
        b.reason === 'childcare',
    );
    expect(motherPickup.length).toBeGreaterThanOrEqual(1);
  });
});

describe('getDayLoad', () => {
  it('returns correct counts for mother on Monday', () => {
    const load = getDayLoad(1, 'mother', mondayBlocks);
    expect(load.blocked).toBeGreaterThan(0);
    expect(load.blocked + load.limited + load.free).toBe(36); // 18h × 2 slots
  });

  it('returns correct counts for father on Monday', () => {
    const load = getDayLoad(1, 'father', mondayBlocks);
    expect(load.blocked).toBeGreaterThan(0);
    expect(load.blocked + load.limited + load.free).toBe(36);
  });

  it('shows more blocked slots on office days due to commute', () => {
    const wedBlocks = calculateTimeBlocks(3, workSchedules, allFixedEvents);
    const motherMon = getDayLoad(1, 'mother', mondayBlocks);
    const motherWed = getDayLoad(3, 'mother', wedBlocks);
    // Wed is office day with 60 min commute → more blocked
    expect(motherWed.blocked).toBeGreaterThan(motherMon.blocked);
  });
});

describe('getAvailableSlots', () => {
  it('returns only free and limited slots (no blocked)', () => {
    const available = getAvailableSlots(1, 'mother', mondayBlocks);
    // Verify none of these overlap with blocked slots
    const motherBlocked = mondayBlocks.filter(
      (b) => b.owner === 'mother' && b.day === 1 && b.status === 'blocked',
    );
    const blockedTimes = new Set(motherBlocked.map((b) => b.slot.start));
    for (const slot of available) {
      expect(blockedTimes.has(slot.start)).toBe(false);
    }
  });

  it('returns fewer available slots when the day is busier', () => {
    const wedBlocks = calculateTimeBlocks(3, workSchedules, allFixedEvents);
    const motherMonAvail = getAvailableSlots(1, 'mother', mondayBlocks);
    const motherWedAvail = getAvailableSlots(3, 'mother', wedBlocks);
    // Wed has office commute + own training → fewer slots
    expect(motherWedAvail.length).toBeLessThan(motherMonAvail.length);
  });

  it('returns slots with valid HH:MM format', () => {
    const available = getAvailableSlots(1, 'father', mondayBlocks);
    const timeRegex = /^\d{2}:\d{2}$/;
    for (const slot of available) {
      expect(slot.start).toMatch(timeRegex);
      expect(slot.end).toMatch(timeRegex);
    }
  });
});
