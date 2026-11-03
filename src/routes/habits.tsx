import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useHabits } from "@/lib/store";
import { WEEKDAYS, type Habit } from "@/lib/habit-logic";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Manage Habits — HabitFlow" },
      { name: "description", content: "Add, edit and delete habits with categories, icons and schedules." },
      { property: "og:title", content: "Manage Habits — HabitFlow" },
      { property: "og:description", content: "Add, edit and delete habits with categories, icons and schedules." },
    ],
  }),
  component: Habits,
});

const ICONS = ["✅", "💧", "🏃", "📚", "🧘", "💪", "🍎", "😴", "✍️", "🎯", "🧠", "🚭", "🙏", "💰", "🎸", "🧹", "🌞", "💊", "🚶", "📵"];
const ALL = [0, 1, 2, 3, 4, 5, 6];

function Habits() {
  const { habits, saveHabit, removeHabit, today } = useHabits();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [deleting, setDeleting] = useState<Habit | null>(null);
  const categories = [...new Set(habits.map((h) => h.category))];

  const blank = (): Habit => ({ id: crypto.randomUUID(), name: "", icon: "✅", category: categories[0] ?? "Health", schedule: ALL, startDate: today, createdAt: Date.now() });

  return (
    <>
      <PageHeader title="Habits" sub={`${habits.length} active`}>
        <Button variant="hero" onClick={() => setEditing(blank())}><Plus /> New habit</Button>
      </PageHeader>
      {categories.length === 0 && <Panel><p className="py-8 text-center text-muted-foreground">No habits yet — tap “New habit”.</p></Panel>}
      <div className="space-y-4">
        {categories.map((cat) => (
          <Panel key={cat} title={cat}>
            <ul className="divide-y divide-border">
              {habits.filter((h) => h.category === cat).map((h) => (
                <li key={h.id} className="flex items-center gap-3 py-3">
                  <span className="text-2xl">{h.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.schedule.length === 7 ? "Every day" : h.schedule.map((d) => WEEKDAYS[d]).join(", ")} · since {h.startDate}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(h)} aria-label={`Edit ${h.name}`}><Pencil /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(h)} aria-label={`Delete ${h.name}`}><Trash2 className="text-destructive" /></Button>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{habits.some((h) => h.id === editing?.id) ? "Edit habit" : "New habit"}</DialogTitle></DialogHeader>
          {editing && (
            <HabitForm
              initial={editing}
              categories={categories}
              onSave={async (h) => {
                await saveHabit(h);
                toast.success("Habit saved");
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the habit and all of its check-in history. Export a backup first if you might want it back.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleting) await removeHabit(deleting.id);
                toast.success("Habit deleted");
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function HabitForm({ initial, categories, onSave }: { initial: Habit; categories: string[]; onSave: (h: Habit) => void }) {
  const [h, setH] = useState(initial);
  const set = <K extends keyof Habit>(k: K, v: Habit[K]) => setH((p) => ({ ...p, [k]: v }));
  const valid = h.name.trim() && h.category.trim() && h.schedule.length > 0 && h.icon.trim();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave({ ...h, name: h.name.trim(), category: h.category.trim(), schedule: [...h.schedule].sort() });
      }}
    >
      <Field label="Name"><Input autoFocus value={h.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Drink 2L water" maxLength={60} /></Field>
      <Field label="Category">
        <Input value={h.category} onChange={(e) => set("category", e.target.value)} list="cats" placeholder="Health, Learning…" maxLength={30} />
        <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Icon">
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map((i) => (
            <button type="button" key={i} onClick={() => set("icon", i)} className={`h-9 w-9 rounded-lg border text-lg ${h.icon === i ? "border-primary bg-accent" : "border-border bg-muted"}`}>{i}</button>
          ))}
          <Input className="h-9 w-20" value={h.icon} onChange={(e) => set("icon", [...e.target.value].slice(-2).join(""))} aria-label="Custom icon (any emoji)" placeholder="Custom" />
        </div>
      </Field>
      <Field label="Schedule">
        <div className="mb-2 flex gap-2">
          <Button type="button" size="sm" variant={h.schedule.length === 7 ? "default" : "secondary"} onClick={() => set("schedule", ALL)}>Daily</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => set("schedule", [1, 2, 3, 4, 5])}>Weekdays</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => set("schedule", [0, 6])}>Weekends</Button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => {
            const on = h.schedule.includes(i);
            return (
              <button type="button" key={w} aria-pressed={on} onClick={() => set("schedule", on ? h.schedule.filter((x) => x !== i) : [...h.schedule, i])} className={`rounded-lg border py-2 text-xs font-medium ${on ? "border-primary bg-accent text-accent-foreground" : "border-border bg-muted text-muted-foreground"}`}>{w}</button>
            );
          })}
        </div>
      </Field>
      <Field label="Track from"><Input type="date" value={h.startDate} onChange={(e) => e.target.value && set("startDate", e.target.value)} /></Field>
      <Button type="submit" variant="hero" className="w-full" disabled={!valid}>Save habit</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
