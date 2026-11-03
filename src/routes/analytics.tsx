import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Empty, PageHeader, Panel, Stat } from "@/components/AppShell";
import { BarChart, Donut, LineChart } from "@/components/Charts";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/lib/store";
import { addDays, dayStats, fromISO, habitRange, habitStreaks, missedCounts, monthRange, overallStreak, rangeStats, toISO, weekStart } from "@/lib/habit-logic";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — HabitFlow" },
      { name: "description", content: "Charts, heatmap, streaks and most-missed habits." },
      { property: "og:title", content: "Analytics — HabitFlow" },
      { property: "og:description", content: "Charts, heatmap, streaks and most-missed habits." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { habits, completions, today } = useHabits();
  const t = fromISO(today);
  const [ym, setYm] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const shift = (n: number) => setYm(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));
  if (!habits.length) return (<><PageHeader title="Analytics" /><Empty /></>);

  const { from, to } = monthRange(ym.y, ym.m);
  const month = rangeStats(habits, completions, from, to, today);
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  const lineVals = days.map((d) => (d > today ? null : dayStats(habits, completions, d).due ? dayStats(habits, completions, d).pct : null));
  const weeksStart = Array.from({ length: 8 }, (_, i) => addDays(weekStart(today), -7 * (7 - i)));
  const perHabit = habits.map((h) => ({ h, s: habitRange(h, completions, from, to, today), st: habitStreaks(h, completions, today) }));
  const missed = missedCounts(habits, completions, from, to, today).filter((m) => m.missed > 0).slice(0, 5);
  const streak = overallStreak(habits, completions, today);
  const bestEver = Math.max(0, ...perHabit.map((p) => p.st.best));
  const title = new Date(ym.y, ym.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader title="Analytics" sub={title}>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft /></Button>
          <Button variant="secondary" size="icon" onClick={() => shift(1)} aria-label="Next month"><ChevronRight /></Button>
        </div>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Month completion" value={`${month.pct}%`} hint={`${month.done}/${month.due}`} />
        <Stat label="Perfect-day streak" value={streak} hint="current" />
        <Stat label="Best habit streak" value={bestEver} hint="all time" />
        <Stat label="Missed this month" value={month.due - month.done} hint="check-ins" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Panel title="Monthly completion">
          <div className="mx-auto max-w-[220px]"><Donut done={month.done} missed={month.due - month.done} /></div>
        </Panel>
        <Panel title="Daily progress" className="md:col-span-2">
          <div className="h-60"><LineChart labels={days.map((d) => String(fromISO(d).getDate()))} values={lineVals} /></div>
        </Panel>
        <Panel title="Weekly (last 8 weeks)" className="md:col-span-2">
          <div className="h-56">
            <BarChart labels={weeksStart.map((w) => fromISO(w).toLocaleDateString(undefined, { month: "short", day: "numeric" }))} values={weeksStart.map((w) => rangeStats(habits, completions, w, addDays(w, 6), today).pct)} />
          </div>
        </Panel>
        <Panel title="Most missed">
          {missed.length ? (
            <ol className="space-y-2 text-sm">
              {missed.map((m, i) => (
                <li key={m.habit.id} className="flex justify-between"><span>{i + 1}. {m.habit.icon} {m.habit.name}</span><span className="text-destructive">{m.missed}×</span></li>
              ))}
            </ol>
          ) : <p className="text-sm text-muted-foreground">No misses this month.</p>}
        </Panel>
        <Panel title="Habit performance" className="md:col-span-2">
          <div style={{ height: Math.max(160, habits.length * 36) }}>
            <BarChart horizontal labels={perHabit.map((p) => `${p.h.icon} ${p.h.name}`)} values={perHabit.map((p) => p.s.pct)} />
          </div>
        </Panel>
        <Panel title="Streaks">
          <ul className="space-y-2 text-sm">
            {perHabit.map((p) => (
              <li key={p.h.id} className="flex justify-between gap-2"><span className="truncate">{p.h.icon} {p.h.name}</span><span className="shrink-0 text-muted-foreground">🔥 {p.st.current} · best {p.st.best}</span></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Heatmap (last 26 weeks)" className="md:col-span-3"><Heatmap /></Panel>
      </div>
    </>
  );
}

function Heatmap() {
  const { habits, completions, today } = useHabits();
  const start = addDays(weekStart(today), -7 * 25);
  const weeks = Array.from({ length: 26 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  const level = (d: string) => {
    if (d > today) return "bg-transparent";
    const s = dayStats(habits, completions, d);
    if (!s.due) return "bg-muted/40";
    if (s.pct === 0) return "bg-muted";
    if (s.pct < 50) return "bg-primary/30";
    if (s.pct < 100) return "bg-primary/60";
    return "bg-primary";
  };
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((w) => (
          <div key={w[0]} className="flex flex-col gap-1">
            {w.map((d) => (
              <div key={d} title={`${d}: ${d > today ? "" : dayStats(habits, completions, d).pct + "%"}`} className={`h-3.5 w-3.5 rounded-sm ${level(d)} ${d === today ? "ring-1 ring-foreground" : ""}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        Less <span className="h-3 w-3 rounded-sm bg-muted" /><span className="h-3 w-3 rounded-sm bg-primary/30" /><span className="h-3 w-3 rounded-sm bg-primary/60" /><span className="h-3 w-3 rounded-sm bg-primary" /> More · {toISO(fromISO(start))} → {today}
      </div>
    </div>
  );
}
