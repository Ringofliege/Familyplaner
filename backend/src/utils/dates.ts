import { format, subDays, addDays, parseISO } from 'date-fns';

/** Get today's date as ISO string YYYY-MM-DD */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Get the start of the current week (Monday) as ISO string */
export function weekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start
  return format(subDays(now, diff), 'yyyy-MM-dd');
}

/** Get end of week (Sunday) as ISO string */
export function weekEndISO(): string {
  const start = weekStartISO();
  return format(addDays(parseISO(start), 6), 'yyyy-MM-dd');
}

/** Get day-of-week number (0=Sun, 6=Sat) */
export function todayDow(): number {
  return new Date().getDay();
}
