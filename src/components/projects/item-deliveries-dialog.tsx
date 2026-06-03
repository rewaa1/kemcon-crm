"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addProjectItemStageAction,
  deleteProjectItemStageAction,
} from "@/app/[locale]/(dashboard)/projects/[id]/actions";
import type { ProjectItem } from "@/domain/project";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  item: ProjectItem;
};

export function ItemDeliveriesDialog({ open, onOpenChange, projectId, item }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const [qty, setQty] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);

  const total = item.itemCount ?? 0;
  const delivered = item.stages.reduce((sum, s) => sum + s.quantity, 0);
  const remaining = Math.max(total - delivered, 0);
  const pct = total > 0 ? Math.min(Math.round((delivered / total) * 100), 100) : 0;
  const fabricName = item.fabric?.nameEn ?? item.customFabricName ?? "—";

  function handleAdd() {
    const q = Number(qty);
    if (!Number.isInteger(q) || q <= 0) {
      toast.error(t("deliveries.invalidQty"));
      return;
    }
    startTransition(async () => {
      const result = await addProjectItemStageAction(projectId, item.id, {
        quantity: q,
        stageDate: date,
        notes: notes.trim() || undefined,
      });
      if (result.success) {
        toast.success(t("deliveries.addedSuccess"));
        setQty("");
        setNotes("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(stageId: string) {
    startTransition(async () => {
      const result = await deleteProjectItemStageAction(projectId, stageId);
      if (result.success) {
        toast.success(t("deliveries.deletedSuccess"));
      } else {
        toast.error(result.error);
      }
      setDeleteStageId(null);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("deliveries.title")}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground -mt-1">
          {fabricName} · {item.itemTypeEn}
        </div>

        {total === 0 ? (
          <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
            {t("deliveries.noPieceCount")}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium tabular-nums">
                  {delivered.toLocaleString()} / {total.toLocaleString()} {t("deliveries.pieces")}
                </span>
                <span className="text-muted-foreground tabular-nums">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={remaining === 0 ? "h-full bg-green-600 transition-all" : "h-full bg-primary transition-all"}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {remaining > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("deliveries.remaining", { count: remaining })}
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("deliveries.complete")}
                </p>
              )}
            </div>

            {/* Stage timeline */}
            {item.stages.length > 0 && (
              <div className="rounded-md border divide-y max-h-56 overflow-y-auto">
                {item.stages.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <div className="font-semibold tabular-nums w-14 shrink-0">
                      {s.quantity.toLocaleString()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-muted-foreground">{format(new Date(s.stageDate), "PP")}</div>
                      {s.notes && <div className="truncate text-xs text-muted-foreground">{s.notes}</div>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                      aria-label={tc("delete")}
                      onClick={() => setDeleteStageId(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Record a new delivery */}
            {remaining > 0 && (
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("deliveries.addStage")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("deliveries.quantity")}</label>
                    <Input
                      type="number" onWheel={(e) => e.currentTarget.blur()}
                      min="1" step="1" max={remaining}
                      placeholder={`${t("deliveries.max")} ${remaining}`}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("deliveries.date")}</label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <Input
                  placeholder={t("deliveries.notesPlaceholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="flex justify-end">
                  <Button size="sm" className="h-8" disabled={isPending || !qty} onClick={handleAdd}>
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1" /> : <Plus className="h-3.5 w-3.5 me-1" />}
                    {t("deliveries.record")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <AlertDialog open={!!deleteStageId} onOpenChange={(o) => !o && setDeleteStageId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deliveries.deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("deliveries.deleteConfirm")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteStageId && handleDelete(deleteStageId)}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {tc("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
