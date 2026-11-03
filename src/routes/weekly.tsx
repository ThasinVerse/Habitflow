import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { CheckCell, Empty, PageHeader, Panel, Stat } from "@/components/AppShell";
import { BarChart } from "@/components/Charts";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/lib/store";
import { addDays, ckey, dayStats, fromISO, isDue, missedCounts, rangeStats, weekStart, WEEKDAYS } from "@/lib/habit-logic";

export const Route = createFileRoute("/weekly")({
  head: () => ({
    meta: [
      { title: "Weekly Tracker — HabitFlow" },
      { name: "description", content: "Seven-day habit view with daily percentages and missed-habit analysis." },
      { property: "og:title", content: "Weekly Tracker — HabitFlow" },
      { property: "og:description", content: "Seven-day habit view with daily percentages and missed-habit analysis." },
    ],
  }),
  component: Weekly,
});

const fmt = (d: string) => fromISO(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function Weekly() {
  const { habits, completions, today, toggle } = useHabits();
  const [start, setStart] = useState(() => weekStart(today));
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const end = days[6]!;
  const week = rangeStats(habits, completions, start, end, today);
  const prev = rangeStats(habits, completions, addDays(start, -7), addDays(start, -1), today);
  const delta = week.pct - prev.pct;
  const missed = missedCounts(habits, completions, start, end, today).filter((m) => m.missed > 0);
  // last 6 weeks comparison
  const weeks = Array.from({ length: 6 }, (_, i) => addDays(start, -7 * (5 - i)));

  return (
    <>
      <PageHeader title="Weekly Tracker" sub={`${fmt(start)} – ${fmt(end)}`}>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" onClick={() => setStart(addDays(start, -7))} aria-label="Previous week"><ChevronLeft /></Button>
          <Button variant="secondary" onClick={() => setStart(weekStart(today))}>This week</Button>
          <Button variant="secondary" size="icon" onClick={() => setStart(addDays(start, 7))} aria-label="Next week"><ChevronRight /></Button>
        </div>
      </PageHeader>
      {!habits.length ? (
        <Empty />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Stat label="This week" value={`${week.pct}%`} hint={`${week.done}/${week.due}`} />
            <Stat label="Last week" value={`${prev.pct}%`} hint={`${prev.done}/${prev.due}`} />
            <Stat label="Change" value={<span className={delta >= 0 ? "text-success" : "text-destructive"}>{delta >= 0 ? "+" : ""}{delta}%</span>} hint="vs previous week" />
          </div>

          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-1 text-sm">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-muted-foreground">Habit</th>
                    {days.map((d) => (
                      <th key={d} className={`text-center text-xs font-medium ${d === today ? "text-primary" : "text-muted-foreground"}`}>
                        {WEEKDAYS[fromISO(d).getDay()]}
                        <div>{fromISO(d).getDate()}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habits.map((h) => (
                    <tr key={h.id}>
                      <td className="max-w-[5.5rem] truncate text-xs sm:max-w-[9rem] sm:text-sm" title={h.name}>{h.icon} {h.name}</td>
                      {days.map((d) => (
                        <td key={d} className="text-center">
                          {isDue(h, d) ? (
                            <CheckCell checked={completions.has(ckey(h.id, d))} disabled={d > today} onClick={() => toggle(h.id, d)} label={`${h.name} on ${d}`} />
                          ) : (
                            <span className="text-muted-foreground/40">·</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-2 text-xs font-semibold text-muted-foreground">Daily %</td>
                    {days.map((d) => {
                      const s = dayStats(habits, completions, d);
                      return (
                        <td key={d} className="pt-2 text-center text-xs font-semibold text-primary">
                          {d > today || !s.due ? "–" : `${s.pct}`}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Panel title="Weekly performance">
              <div className="h-56">
                <BarChart labels={weeks.map(fmt)} values={weeks.map((w) => rangeStats(habits, completions, w, addDays(w, 6), today).pct)} />
              </div>
            </Panel>
            <Panel title="Missed this week">
              {missed.length ? (
                <ul className="space-y-3">
                  {missed.map((m) => (
                    <li key={m.habit.id}>
                      <div className="flex justify-between text-sm">
                        <span>{m.habit.icon} {m.habit.name}</span>
                        <span className="text-destructive">{m.missed} missed</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-destructive" style={{ width: `${(m.missed / Math.max(1, m.due)) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing missed so far. 💪</p>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
