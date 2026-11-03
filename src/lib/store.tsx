import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as db from "./db";
import { ckey, toISO, type Habit } from "./habit-logic";

type Ctx = {
  ready: boolean;
  habits: Habit[];
  completions: Set<string>;
  today: string;
  toggle: (habitId: string, date: string) => void;
  saveHabit: (h: Habit) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

const HabitCtx = createContext<Ctx | null>(null);

export function HabitProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [today, setToday] = useState("");

  const reload = useCallback(async () => {
    const data = await db.loadAll();
    setHabits(data.habits);
    setCompletions(new Set(data.completions));
    setReady(true);
  }, []);

  useEffect(() => {
    setToday(toISO(new Date()));
    reload();
    // Roll over at midnight / when returning to the tab
    const tick = () => setToday(toISO(new Date()));
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [reload]);

  const toggle = useCallback((habitId: string, date: string) => {
    const k = ckey(habitId, date);
    setCompletions((prev) => {
      const next = new Set(prev);
      const done = !next.has(k);
      if (done) next.add(k);
      else next.delete(k);
      db.setCompletion(k, done);
      return next;
    });
  }, []);

  const saveHabit = useCallback(async (h: Habit) => {
    await db.putHabit(h);
    setHabits((prev) => {
      const i = prev.findIndex((x) => x.id === h.id);
      if (i === -1) return [...prev, h];
      const n = [...prev];
      n[i] = h;
      return n;
    });
  }, []);

  const removeHabit = useCallback(async (id: string) => {
    await db.deleteHabit(id);
    setHabits((p) => p.filter((h) => h.id !== id));
    setCompletions((p) => new Set([...p].filter((k) => !k.startsWith(id + "|"))));
  }, []);

  const value = useMemo(
    () => ({ ready: ready && !!today, habits, completions, today, toggle, saveHabit, removeHabit, reload }),
    [ready, habits, completions, today, toggle, saveHabit, removeHabit, reload],
  );
  return <HabitCtx.Provider value={value}>{children}</HabitCtx.Provider>;
}

export function useHabits() {
  const c = useContext(HabitCtx);
  if (!c) throw new Error("useHabits outside provider");
  return c;
}
