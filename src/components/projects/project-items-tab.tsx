"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Layers, Truck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { AddItemWizard } from "./add-item-wizard";
import { EditProjectItemDialog } from "./edit-project-item-dialog";
import { ItemDeliveriesDialog } from "./item-deliveries-dialog";
import { deleteProjectItemAction } from "@/app/[locale]/(dashboard)/projects/[id]/actions";
import type { ProjectItem, SupplySource } from "@/domain/project";
import type { FabricSummary } from "@/domain/fabric";
import type { FabricStockSummary } from "@/domain/inventory";
import type { HotelLocation } from "@/domain/hotel";

type Props = {
  projectId: string;
  hotelId: string;
  items: ProjectItem[];
  fabrics: FabricSummary[];
  stockSummary: FabricStockSummary[];
  locations: HotelLocation[];
};

const SOURCE_VARIANT: Record<SupplySource, "default" | "secondary" | "outline"> = {
  INVENTORY: "default",
  CLIENT: "secondary",
  DIRECT: "outline",
};

export function ProjectItemsTab({ projectId, hotelId, items, fabrics, stockSummary, locations }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);
  // Track by id so the dialog reflects fresh stage data after revalidation.
  const [deliveryTargetId, setDeliveryTargetId] = useState<string | null>(null);
  const deliveryTarget = deliveryTargetId ? items.find((i) => i.id === deliveryTargetId) ?? null : null;
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteProjectItemAction(projectId, deleteTarget.id);
      if (result.success) {
        toast.success(t("itemDeletedSuccess"));
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t("addItem")}
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t("noItems")}
          description={t("noItemsDesc")}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fabricCode")}</TableHead>
                <TableHead>{t("fabric")}</TableHead>
                <TableHead>{t("itemType")}</TableHead>
                <TableHead>{t("location")}</TableHead>
                <TableHead className="text-end">{t("quantityNeeded")}</TableHead>
                <TableHead className="text-end">{t("wizard.itemCount")}</TableHead>
                <TableHead className="text-end">{t("wizard.productionLoss")}</TableHead>
                <TableHead className="text-end">{t("wizard.fabricLeftover")}</TableHead>
                <TableHead>{t("sourceLabel")}</TableHead>
                <TableHead>{t("deliveries.column")}</TableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const locationLabel = item.location?.nameEn ?? item.locationNoteEn ?? "—";
                const unitLabel = item.unit === "METERS" ? t("unitMeters") : t("unitRolls");
                const total = item.itemCount ?? 0;
                const delivered = item.stages.reduce((sum, s) => sum + s.quantity, 0);
                const pct = total > 0 ? Math.min(Math.round((delivered / total) * 100), 100) : 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.fabric?.codeRef ?? item.customFabricCode ?? "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.fabric?.nameEn ?? item.customFabricName ?? "—"}</div>
                      {item.fabric?.nameAr && (
                        <div className="text-sm text-muted-foreground" dir="rtl">{item.fabric.nameAr}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{item.itemTypeEn}</div>
                      {item.itemTypeAr && (
                        <div className="text-sm text-muted-foreground" dir="rtl">{item.itemTypeAr}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{locationLabel}</TableCell>
                    <TableCell className="text-end font-medium">
                      {item.quantityNeeded.toLocaleString()} {unitLabel}
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground text-sm">
                      {item.itemCount != null ? item.itemCount.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className={`text-end text-sm font-medium ${item.productionLoss != null && item.productionLoss > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {item.productionLoss != null ? `${item.productionLoss.toLocaleString()} ${unitLabel}` : "—"}
                    </TableCell>
                    <TableCell className={`text-end text-sm font-medium ${item.fabricLeftover != null && item.fabricLeftover < 0 ? "text-destructive" : item.fabricLeftover != null ? "text-green-600" : "text-muted-foreground"}`}>
                      {item.fabricLeftover != null ? `${item.fabricLeftover.toLocaleString()} ${unitLabel}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={SOURCE_VARIANT[item.source]}>
                        {t(`source.${item.source}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setDeliveryTargetId(item.id)}
                        className="flex items-center gap-2 group"
                        aria-label={t("deliveries.column")}
                      >
                        {item.itemCount != null ? (
                          <>
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={pct >= 100 ? "h-full bg-green-600" : "h-full bg-primary"}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground group-hover:text-foreground">
                              {delivered.toLocaleString()}/{total.toLocaleString()}
                            </span>
                            {pct >= 100 && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5" />
                            {t("deliveries.track")}
                          </span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${item.fabric?.nameEn ?? item.customFabricName ?? "item"}`}
                          onClick={() => setEditTarget(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${item.fabric?.nameEn ?? item.customFabricName ?? "item"}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AddItemWizard
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId}
        hotelId={hotelId}
        fabrics={fabrics}
        stockSummary={stockSummary}
        locations={locations}
      />

      {editTarget && (
        <EditProjectItemDialog
          open={!!editTarget}
          onOpenChange={(o) => { if (!o) setEditTarget(null); }}
          projectId={projectId}
          item={editTarget}
          locations={locations}
        />
      )}

      {deliveryTarget && (
        <ItemDeliveriesDialog
          open={!!deliveryTarget}
          onOpenChange={(o) => { if (!o) setDeliveryTargetId(null); }}
          projectId={projectId}
          item={deliveryTarget}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteItem")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteItemConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
