import { createFileRoute } from "@tanstack/react-router";
import { Flame, Trophy, TrendingDown } from "lucide-react";
import { CheckCell, Empty, PageHeader, Panel, Stat } from "@/components/AppShell";
import { useHabits } from "@/lib/store";
import { ckey, dayStats, fromISO, habitRange, habitStreaks, isDue, monthRange, overallStreak, rangeStats } from "@/lib/habit-logic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — HabitFlow" },
      { name: "description", content: "Today's habits, progress, streaks and monthly score." },
      { property: "og:title", content: "Today — HabitFlow" },
      { property: "og:description", content: "Today's habits, progress, streaks and monthly score." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { habits, completions, today, toggle } = useHabits();
  if (!habits.length)
    return (
      <>
        <PageHeader title="Welcome to HabitFlow" sub="Your private habit tracker." />
        <Empty />
      </>
    );

  const d = fromISO(today);
  const t = dayStats(habits, completions, today);
  const { from, to } = monthRange(d.getFullYear(), d.getMonth());
  const month = rangeStats(habits, completions, from, to, today);
  const streak = overallStreak(habits, completions, today);
  const ranked = habits
    .map((h) => ({ h, s: habitRange(h, completions, from, to, today) }))
    .filter((x) => x.s.due > 0)
    .sort((a, b) => b.s.pct - a.s.pct);
  const best = ranked[0];
  const weakest = ranked.length > 1 ? ranked[ranked.length - 1] : undefined;
  const dueToday = habits.filter((h) => isDue(h, today));
  const notToday = habits.filter((h) => !isDue(h, today));

  return (
    <>
      <PageHeader title="Today" sub={d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} />

      <div className="grid gap-4 md:grid-cols-[1.2fr_2fr]">
        <Panel className="flex items-center gap-5">
          <Ring pct={t.pct} />
          <div>
            <p className="text-sm text-muted-foreground">Today's progress</p>
            <p className="font-display text-3xl font-semibold">
              {t.done}/{t.due}
            </p>
            <p className="text-sm text-muted-foreground">{t.due === 0 ? "Nothing due today" : t.pct === 100 ? "Perfect day 🎉" : `${t.due - t.done} left`}</p>
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat label="Monthly score" value={`${month.pct}%`} hint={`${month.done} of ${month.due} check-ins`} />
          <Stat label="Active habits" value={habits.length} hint={`${dueToday.length} due today`} />
          <Stat label="Perfect streak" value={<span className="flex items-center gap-1">{streak}<Flame className="h-5 w-5 text-warning" /></span>} hint="days in a row" />
          <Stat label="Best habit" value={<Trophy className="h-6 w-6 text-success" />} hint={best ? `${best.h.icon} ${best.h.name} · ${best.s.pct}%` : "—"} />
          <Stat label="Weakest habit" value={<TrendingDown className="h-6 w-6 text-destructive" />} hint={weakest ? `${weakest.h.icon} ${weakest.h.name} · ${weakest.s.pct}%` : "—"} />
          <Stat label="This month" value={d.toLocaleDateString(undefined, { month: "short" })} hint={`Day ${d.getDate()}`} />
        </div>
      </div>

      <Panel title="Today's habits" className="mt-4">
        <ul className="divide-y divide-border">
          {dueToday.map((h) => {
            const done = completions.has(ckey(h.id, today));
            const st = habitStreaks(h, completions, today);
            return (
              <li key={h.id} className="flex items-center gap-3 py-3">
                <span className="text-2xl">{h.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${done ? "text-muted-foreground line-through" : ""}`}>{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.category} · 🔥 {st.current} streak
                  </p>
                </div>
                <CheckCell checked={done} onClick={() => toggle(h.id, today)} label={`Mark ${h.name} done today`} />
              </li>
            );
          })}
          {!dueToday.length && <li className="py-3 text-sm text-muted-foreground">No habits scheduled today.</li>}
        </ul>
        {notToday.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Not scheduled today: {notToday.map((h) => `${h.icon} ${h.name}`).join(", ")}</p>}
      </Panel>
    </>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90">
      <circle cx="50" cy="50" r={r} className="fill-none stroke-muted" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} className="fill-none stroke-primary transition-all duration-500" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
      <text x="50" y="50" className="rotate-90 fill-foreground font-display text-xl font-semibold" style={{ transformOrigin: "50px 50px" }} textAnchor="middle" dominantBaseline="central">
        {pct}%
      </text>
    </svg>
  );
}
