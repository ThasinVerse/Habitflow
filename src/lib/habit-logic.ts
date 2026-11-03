// Pure date + scoring logic for HabitFlow. No browser APIs here.

export type Habit = {
  id: string;
  name: string;
  icon: string;
  category: string;
  /** Weekdays the habit is due: 0 = Sunday … 6 = Saturday. All 7 = daily. */
  schedule: number[];
  /** YYYY-MM-DD — the habit only counts as "due" from this date on. */
  startDate: string;
  createdAt: number;
};

export type Completions = Set<string>;

export const ckey = (habitId: string, date: string) => `${habitId}|${date}`;

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISO(s: string): Date {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export type MonthSegment = { label: string; start: number; end: number };

/** Week 1: 1–7, Week 2: 8–14, Week 3: 15–21, Week 4: 22–28, Extra: 29–end. */
export function monthSegments(year: number, month0: number): MonthSegment[] {
  const dim = daysInMonth(year, month0);
  const segs: MonthSegment[] = [
    { label: "Week 1", start: 1, end: 7 },
    { label: "Week 2", start: 8, end: 14 },
    { label: "Week 3", start: 15, end: 21 },
    { label: "Week 4", start: 22, end: 28 },
  ];
  if (dim > 28) segs.push({ label: "Extra Days", start: 29, end: dim });
  return segs;
}

export function isDue(h: Habit, date: string): boolean {
  if (date < h.startDate) return false;
  return h.schedule.includes(fromISO(date).getDay());
}

export function dayStats(habits: Habit[], c: Completions, date: string) {
  let due = 0;
  let done = 0;
  for (const h of habits) {
    if (!isDue(h, date)) continue;
    due++;
    if (c.has(ckey(h.id, date))) done++;
  }
  return { due, done, pct: due ? Math.round((done / due) * 100) : 0 };
}

/** Aggregate over an inclusive date range, ignoring dates after `today`. */
export function rangeStats(habits: Habit[], c: Completions, from: string, to: string, today: string) {
  let due = 0;
  let done = 0;
  const end = to < today ? to : today;
  for (let d = from; d <= end; d = addDays(d, 1)) {
    const s = dayStats(habits, c, d);
    due += s.due;
    done += s.done;
  }
  return { due, done, pct: due ? Math.round((done / due) * 100) : 0 };
}

export function habitRange(h: Habit, c: Completions, from: string, to: string, today: string) {
  return rangeStats([h], c, from, to, today);
}

/** Overall perfect-day streak: consecutive days where every due habit was done.
 *  Days with nothing due are skipped. Today counts only once it is complete. */
export function overallStreak(habits: Habit[], c: Completions, today: string) {
  if (!habits.length) return 0;
  const earliest = habits.reduce((m, h) => (h.startDate < m ? h.startDate : m), today);
  let streak = 0;
  let d = today;
  const t = dayStats(habits, c, today);
  if (t.due > 0 && t.done < t.due) d = addDays(today, -1);
  for (; d >= earliest; d = addDays(d, -1)) {
    const s = dayStats(habits, c, d);
    if (s.due === 0) continue;
    if (s.done === s.due) streak++;
    else break;
  }
  return streak;
}

/** Current and best streak for one habit, counted in due occurrences. */
export function habitStreaks(h: Habit, c: Completions, today: string) {
  let best = 0;
  let run = 0;
  for (let d = h.startDate; d <= today; d = addDays(d, 1)) {
    if (!isDue(h, d)) continue;
    if (c.has(ckey(h.id, d))) {
      run++;
      if (run > best) best = run;
    } else if (d !== today) run = 0;
  }
  // current: walk back from today
  let current = 0;
  for (let d = today; d >= h.startDate; d = addDays(d, -1)) {
    if (!isDue(h, d)) continue;
    if (c.has(ckey(h.id, d))) current++;
    else if (d === today) continue;
    else break;
  }
  return { current, best };
}

export function monthRange(year: number, month0: number) {
  const from = toISO(new Date(year, month0, 1));
  const to = toISO(new Date(year, month0, daysInMonth(year, month0)));
  return { from, to };
}

/** Monday-start week containing `date`. */
export function weekStart(date: string): string {
  const d = fromISO(date);
  const offset = (d.getDay() + 6) % 7;
  return addDays(date, -offset);
}

export function missedCounts(habits: Habit[], c: Completions, from: string, to: string, today: string) {
  return habits
    .map((h) => {
      const s = habitRange(h, c, from, to, today);
      return { habit: h, missed: s.due - s.done, due: s.due, pct: s.pct };
    })
    .sort((a, b) => b.missed - a.missed);
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
