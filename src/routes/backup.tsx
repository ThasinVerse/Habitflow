import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useHabits } from "@/lib/store";
import { parseBackup, restore, type Backup } from "@/lib/db";

export const Route = createFileRoute("/backup")({
  head: () => ({
    meta: [
      { title: "Backup & Restore — HabitFlow" },
      { name: "description", content: "Export and import your HabitFlow data as JSON." },
      { property: "og:title", content: "Backup & Restore — HabitFlow" },
      { property: "og:description", content: "Export and import your HabitFlow data as JSON." },
    ],
  }),
  component: BackupPage,
});

function BackupPage() {
  const { habits, completions, today, reload } = useHabits();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);

  const exportJson = () => {
    const data: Backup = { app: "HabitFlow", version: 1, exportedAt: new Date().toISOString(), habits, completions: [...completions] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `habitflow-backup-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Backup downloaded");
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      setPending(parseBackup(await f.text()));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read file");
    }
    if (file.current) file.current.value = "";
  };

  const apply = async (mode: "replace" | "merge") => {
    if (!pending) return;
    await restore(pending, mode);
    await reload();
    setPending(null);
    toast.success(mode === "replace" ? "Data replaced from backup" : "Backup merged");
  };

  return (
    <>
      <PageHeader title="Backup & Restore" sub="Your data lives only in this browser. Back it up regularly." />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Export">
          <p className="mb-4 text-sm text-muted-foreground">{habits.length} habits · {completions.size} check-ins stored on this device.</p>
          <Button variant="hero" onClick={exportJson}><Download /> Download JSON backup</Button>
        </Panel>
        <Panel title="Import">
          <p className="mb-4 text-sm text-muted-foreground">Choose a HabitFlow backup file. You'll be asked before anything changes.</p>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="secondary" onClick={() => file.current?.click()}><Upload /> Choose backup file</Button>
        </Panel>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              The file has {pending?.habits.length} habits and {pending?.completions.length} check-ins. You currently have {habits.length} habits and {completions.size} check-ins.
              “Merge” keeps your current data and adds the backup. “Replace” erases current data first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="secondary" onClick={() => apply("merge")}>Merge</Button>
            <Button variant="destructive" onClick={() => apply("replace")}>Replace all</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
