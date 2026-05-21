"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { InventoryBatchWithPO } from "@/domain/inventory";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabricName: string;
  unit: string;
  batches: InventoryBatchWithPO[];
};

export function BatchHistoryDialog({ open, onOpenChange, fabricName, unit, batches }: Props) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");

  const unitLabel = unit === "METERS" ? t("unitMeters") : t("unitRolls");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("batchHistory")} — {fabricName}</DialogTitle>
        </DialogHeader>

        {batches.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("noBatches")}</p>
        ) : (
          <div className="rounded-md border max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("receivedAt")}</TableHead>
                  <TableHead>{t("fromPO")}</TableHead>
                  <TableHead className="text-end">{t("quantityIn")} ({unitLabel})</TableHead>
                  <TableHead className="text-end">{t("quantityLeft")} ({unitLabel})</TableHead>
                  <TableHead className="text-end">{t("unitCost")}</TableHead>
                  <TableHead className="text-end">{t("metersPerRoll")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => {
                  const pctLeft = batch.quantityIn > 0
                    ? batch.quantityLeft / batch.quantityIn
                    : 0;
                  const isEmpty = batch.quantityLeft === 0;
                  const isLow = !isEmpty && pctLeft <= 0.2;

                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="text-sm">
                        {format(new Date(batch.receivedAt), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {batch.purchaseOrderLine?.purchaseOrder.poNumber ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-end">{batch.quantityIn.toLocaleString()}</TableCell>
                      <TableCell className="text-end">
                        <span className={isEmpty ? "text-destructive font-medium" : isLow ? "text-amber-600 font-medium" : ""}>
                          {batch.quantityLeft.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-end text-muted-foreground">
                        {batch.unitCost != null
                          ? `${batch.unitCost.toLocaleString()} ${batch.currency}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-end text-muted-foreground">
                        {batch.metersPerRoll != null ? `${batch.metersPerRoll}m` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {batches.length > 0 && (
          <div className="flex justify-end gap-6 text-sm pt-1">
            <span className="text-muted-foreground">
              {t("totalIn")}:{" "}
              <span className="font-medium text-foreground">
                {batches.reduce((s, b) => s + b.quantityIn, 0).toLocaleString()} {unitLabel}
              </span>
            </span>
            <span className="text-muted-foreground">
              {t("totalLeft")}:{" "}
              <span className="font-medium text-foreground">
                {batches.reduce((s, b) => s + b.quantityLeft, 0).toLocaleString()} {unitLabel}
              </span>
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
