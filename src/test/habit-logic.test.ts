import { describe, expect, it } from "vitest";
import { ckey, dayStats, habitStreaks, isDue, monthSegments, overallStreak, rangeStats, weekStart, type Habit } from "@/lib/habit-logic";

const h = (id: string, schedule = [0, 1, 2, 3, 4, 5, 6], startDate = "2026-11-01"): Habit => ({ id, name: id, icon: "✅", category: "x", schedule, startDate, createdAt: 0 });

describe("month segments", () => {
  it("splits a 30-day month into 4 weeks plus extra days 29–30", () => {
    const s = monthSegments(2026, 10); // November
    expect(s.map((x) => [x.start, x.end])).toEqual([[1, 7], [8, 14], [15, 21], [22, 28], [29, 30]]);
  });
  it("has no extra segment for a 28-day February", () => {
    expect(monthSegments(2026, 1)).toHaveLength(4);
  });
  it("extra days run 29–31 in a 31-day month", () => {
    expect(monthSegments(2026, 0).at(-1)).toMatchObject({ start: 29, end: 31 });
  });
});

describe("scheduling and scoring", () => {
  it("weekday-only habits are not due on Sunday", () => {
    expect(isDue(h("a", [1, 2, 3, 4, 5]), "2026-11-01")).toBe(false); // Sunday
    expect(isDue(h("a", [1, 2, 3, 4, 5]), "2026-11-02")).toBe(true);
  });
  it("is not due before its start date", () => {
    expect(isDue(h("a", undefined, "2026-11-05"), "2026-11-04")).toBe(false);
  });
  it("daily percentage counts only due habits", () => {
    const c = new Set([ckey("a", "2026-11-02")]);
    expect(dayStats([h("a"), h("b")], c, "2026-11-02")).toEqual({ due: 2, done: 1, pct: 50 });
  });
  it("range ignores future days", () => {
    const c = new Set([ckey("a", "2026-11-01"), ckey("a", "2026-11-02")]);
    expect(rangeStats([h("a")], c, "2026-11-01", "2026-11-30", "2026-11-03")).toEqual({ due: 3, done: 2, pct: 67 });
  });
});

describe("streaks", () => {
  it("unfinished today does not break the streak", () => {
    const c = new Set(["2026-11-01", "2026-11-02"].map((d) => ckey("a", d)));
    expect(overallStreak([h("a")], c, "2026-11-03")).toBe(2);
    expect(habitStreaks(h("a"), c, "2026-11-03")).toEqual({ current: 2, best: 2 });
  });
  it("a missed day resets the current streak but keeps best", () => {
    const c = new Set(["2026-11-01", "2026-11-02", "2026-11-04"].map((d) => ckey("a", d)));
    expect(habitStreaks(h("a"), c, "2026-11-04")).toEqual({ current: 1, best: 2 });
  });
});

it("weeks start on Monday", () => {
  expect(weekStart("2026-11-08")).toBe("2026-11-02"); // Sunday → previous Monday
});
