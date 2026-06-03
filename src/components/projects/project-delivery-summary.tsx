import { useTranslations } from "next-intl";
import { PackageCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProjectItem } from "@/domain/project";

/**
 * Project-wide delivery progress, aggregated from every item that has a
 * piece count. Renders nothing when no item is set up for staged delivery.
 */
export function ProjectDeliverySummary({ items }: { items: ProjectItem[] }) {
  const t = useTranslations("projects");

  const tracked = items.filter((i) => i.itemCount != null);
  if (tracked.length === 0) return null;

  const deliveredOf = (i: ProjectItem) => i.stages.reduce((sum, s) => sum + s.quantity, 0);

  const totalPieces = tracked.reduce((s, i) => s + (i.itemCount ?? 0), 0);
  const deliveredPieces = tracked.reduce((s, i) => s + Math.min(deliveredOf(i), i.itemCount ?? 0), 0);
  const completedItems = tracked.filter((i) => deliveredOf(i) >= (i.itemCount ?? 0)).length;
  const pct = totalPieces > 0 ? Math.min(Math.round((deliveredPieces / totalPieces) * 100), 100) : 0;
  const allDone = completedItems === tracked.length;
  const untracked = items.length - tracked.length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <PackageCheck className={allDone ? "h-4 w-4 text-green-600" : "h-4 w-4 text-muted-foreground"} />
          <span className="text-sm font-medium">{t("deliveries.summaryTitle")}</span>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {t("deliveries.itemsDelivered", { done: completedItems, total: tracked.length })}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={allDone ? "h-full bg-green-600 transition-all" : "h-full bg-primary transition-all"}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {deliveredPieces.toLocaleString()} / {totalPieces.toLocaleString()} {t("deliveries.pieces")} · {pct}%
        </span>
        {untracked > 0 && <span>{t("deliveries.untracked", { count: untracked })}</span>}
      </div>
    </Card>
  );
}
