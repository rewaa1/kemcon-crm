import { useTranslations } from "next-intl";
import { PackageCheck, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProjectItem } from "@/domain/project";

const deliveredOf = (i: ProjectItem) => i.stages.reduce((sum, s) => sum + s.quantity, 0);

/**
 * Project-wide delivery progress: an aggregate bar plus a per-item breakdown,
 * built from every item that has a piece count. Renders nothing when no item
 * is set up for staged delivery.
 */
export function ProjectDeliverySummary({ items }: { items: ProjectItem[] }) {
  const t = useTranslations("projects");

  const tracked = items.filter((i) => i.itemCount != null);
  if (tracked.length === 0) return null;

  const totalPieces = tracked.reduce((s, i) => s + (i.itemCount ?? 0), 0);
  const deliveredPieces = tracked.reduce((s, i) => s + Math.min(deliveredOf(i), i.itemCount ?? 0), 0);
  const completedItems = tracked.filter((i) => deliveredOf(i) >= (i.itemCount ?? 0)).length;
  const pct = totalPieces > 0 ? Math.min(Math.round((deliveredPieces / totalPieces) * 100), 100) : 0;
  const allDone = completedItems === tracked.length;
  const untracked = items.length - tracked.length;

  return (
    <Card className="p-4 space-y-4">
      {/* Aggregate */}
      <div>
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
      </div>

      {/* Per-item breakdown */}
      <div className="border-t pt-3 space-y-2.5">
        {tracked.map((item) => {
          const total = item.itemCount ?? 0;
          const delivered = Math.min(deliveredOf(item), total);
          const itemPct = total > 0 ? Math.min(Math.round((delivered / total) * 100), 100) : 0;
          const done = itemPct >= 100;
          const name = item.fabric?.nameEn ?? item.customFabricName ?? "—";
          return (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate">
                  <span className="font-medium">{item.itemTypeEn}</span>
                  <span className="text-muted-foreground"> · {name}</span>
                </span>
                <span className="flex items-center gap-1 tabular-nums text-muted-foreground shrink-0">
                  {delivered.toLocaleString()} / {total.toLocaleString()}
                  {done && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={done ? "h-full bg-green-600 transition-all" : "h-full bg-primary transition-all"}
                  style={{ width: `${itemPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
