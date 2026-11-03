import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, CalendarDays, CalendarRange, Database, LayoutDashboard, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import { useHabits } from "@/lib/store";

const NAV = [
  { to: "/", label: "Today", icon: LayoutDashboard },
  { to: "/monthly", label: "Monthly", icon: CalendarDays },
  { to: "/weekly", label: "Weekly", icon: CalendarRange },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
  { to: "/habits", label: "Habits", icon: ListChecks },
  { to: "/backup", label: "Backup", icon: Database },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { ready } = useHabits();
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((n) => {
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-sidebar-accent text-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"}`}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto text-xs text-muted-foreground">All data stays on this device.</p>
      </aside>

      <div className="flex-1 pb-24 md:pb-8">
        <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] md:hidden">
          <Brand />
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-5 md:px-8 md:py-8">
          {ready ? children : <div className="py-24 text-center text-muted-foreground">Loading your habits…</div>}
        </main>
      </div>

      <nav className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((n) => {
          const active = path === n.to;
          return (
            <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary font-display text-sm font-bold text-primary-foreground shadow-glow">H</span>
      <span className="font-display text-lg font-semibold">
        Habit<span className="text-gradient">Flow</span>
      </span>
    </Link>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-card p-4 md:p-5 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold md:text-3xl">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CheckCell({ checked, onClick, disabled, label }: { checked: boolean; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-md border text-xs font-bold transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 ${checked ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow" : "border-border bg-muted hover:border-primary"}`}
    >
      {checked ? "✓" : ""}
    </button>
  );
}

export function Empty() {
  return (
    <Panel>
      <div className="py-10 text-center">
        <p className="text-lg font-semibold">No habits yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Create your first habit to start tracking.</p>
        <Link to="/habits" className="mt-4 inline-block rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Add a habit
        </Link>
      </div>
    </Panel>
  );
}
