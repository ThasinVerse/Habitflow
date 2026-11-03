import { openDB, type IDBPDatabase } from "idb";
import type { Habit } from "./habit-logic";

const DB_NAME = "habitflow";
let dbp: Promise<IDBPDatabase> | null = null;

function db() {
  if (!dbp) {
    dbp = openDB(DB_NAME, 1, {
      upgrade(d) {
        d.createObjectStore("habits", { keyPath: "id" });
        d.createObjectStore("completions"); // key: "habitId|YYYY-MM-DD", value: true
      },
    });
  }
  return dbp;
}

export async function loadAll() {
  const d = await db();
  const habits = (await d.getAll("habits")) as Habit[];
  const keys = (await d.getAllKeys("completions")) as string[];
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  return { habits: habits.sort((a, b) => a.createdAt - b.createdAt), completions: keys };
}

export async function putHabit(h: Habit) {
  await (await db()).put("habits", h);
}

export async function deleteHabit(id: string) {
  const d = await db();
  const tx = d.transaction(["habits", "completions"], "readwrite");
  await tx.objectStore("habits").delete(id);
  const store = tx.objectStore("completions");
  let cur = await store.openCursor(IDBKeyRange.bound(`${id}|`, `${id}|\uffff`));
  while (cur) {
    await cur.delete();
    cur = await cur.continue();
  }
  await tx.done;
}

export async function setCompletion(key: string, done: boolean) {
  const d = await db();
  if (done) await d.put("completions", true, key);
  else await d.delete("completions", key);
}

export type Backup = { app: "HabitFlow"; version: 1; exportedAt: string; habits: Habit[]; completions: string[] };

export async function restore(data: Backup, mode: "replace" | "merge") {
  const d = await db();
  const tx = d.transaction(["habits", "completions"], "readwrite");
  if (mode === "replace") {
    await tx.objectStore("habits").clear();
    await tx.objectStore("completions").clear();
  }
  for (const h of data.habits) await tx.objectStore("habits").put(h);
  for (const k of data.completions) await tx.objectStore("completions").put(true, k);
  await tx.done;
}

export function parseBackup(text: string): Backup {
  const j = JSON.parse(text);
  if (!j || !Array.isArray(j.habits) || !Array.isArray(j.completions)) throw new Error("Not a HabitFlow backup file");
  for (const h of j.habits) {
    if (typeof h.id !== "string" || typeof h.name !== "string" || !Array.isArray(h.schedule))
      throw new Error("Backup contains an invalid habit");
    h.icon ??= "✅";
    h.category ??= "General";
    h.startDate ??= "2000-01-01";
    h.createdAt ??= Date.now();
  }
  return { app: "HabitFlow", version: 1, exportedAt: j.exportedAt ?? "", habits: j.habits, completions: j.completions.filter((k: unknown) => typeof k === "string") };
}
