import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { CheckCell, Empty, PageHeader, Panel, Stat } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/lib/store";
import { ckey, fromISO, habitRange, isDue, monthRange, monthSegments, rangeStats, toISO, WEEKDAYS } from "@/lib/habit-logic";

export const Route = createFileRoute("/monthly")({
  head: () => ({
    meta: [
      { title: "Monthly Tracker — HabitFlow" },
      { name: "description", content: "Check off every habit for every day of the month, week by week." },
      { property: "og:title", content: "Monthly Tracker — HabitFlow" },
      { property: "og:description", content: "Check off every habit for every day of the month, week by week." },
    ],
  }),
  component: Monthly,
});

function Monthly() {
  const { habits, completions, today, toggle } = useHabits();
  const t = fromISO(today);
  const [ym, setYm] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const shift = (n: number) => setYm(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));
  const { from, to } = monthRange(ym.y, ym.m);
  const total = rangeStats(habits, completions, from, to, today);
  const title = new Date(ym.y, ym.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader title="Monthly Tracker" sub={title}>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft /></Button>
          <Button variant="secondary" onClick={() => setYm({ y: t.getFullYear(), m: t.getMonth() })}>This month</Button>
          <Button variant="secondary" size="icon" onClick={() => shift(1)} aria-label="Next month"><ChevronRight /></Button>
        </div>
      </PageHeader>
      {!habits.length ? (
        <Empty />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Month score" value={`${total.pct}%`} hint={`${total.done}/${total.due} check-ins`} />
            {monthSegments(ym.y, ym.m).slice(0, 3).map((s) => {
              const r = rangeStats(habits, completions, toISO(new Date(ym.y, ym.m, s.start)), toISO(new Date(ym.y, ym.m, s.end)), today);
              return <Stat key={s.label} label={s.label} value={`${r.pct}%`} hint={`Days ${s.start}–${s.end}`} />;
            })}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {monthSegments(ym.y, ym.m).map((s) => {
              const days = Array.from({ length: s.end - s.start + 1 }, (_, i) => toISO(new Date(ym.y, ym.m, s.start + i)));
              const r = rangeStats(habits, completions, days[0]!, days[days.length - 1]!, today);
              return (
                <Panel key={s.label}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display font-semibold">
                      {s.label} <span className="text-sm font-normal text-muted-foreground">· Days {s.start}–{s.end}</span>
                    </h2>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">{r.pct}%</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-1 text-sm">
                      <thead>
                        <tr>
                          <th className="text-left font-medium text-muted-foreground">Habit</th>
                          {days.map((d) => (
                            <th key={d} className={`w-8 text-center text-[10px] font-medium ${d === today ? "text-primary" : "text-muted-foreground"}`}>
                              {WEEKDAYS[fromISO(d).getDay()]?.[0]}
                              <div className="text-xs">{fromISO(d).getDate()}</div>
                            </th>
                          ))}
                          <th className="w-10 text-right text-[10px] text-muted-foreground">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {habits.map((h) => (
                          <tr key={h.id}>
                            <td className="max-w-[5.5rem] truncate pr-1 text-xs sm:max-w-[9rem] sm:text-sm" title={h.name}>
                              {h.icon} {h.name}
                            </td>
                            {days.map((d) => {
                              const due = isDue(h, d);
                              return (
                                <td key={d} className="text-center">
                                  {due ? (
                                    <CheckCell checked={completions.has(ckey(h.id, d))} disabled={d > today} onClick={() => toggle(h.id, d)} label={`${h.name} on ${d}`} />
                                  ) : (
                                    <span className="inline-block h-7 w-7 leading-7 text-muted-foreground/40">·</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-right text-xs text-muted-foreground">{habitRange(h, completions, days[0]!, days[days.length - 1]!, today).pct}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
