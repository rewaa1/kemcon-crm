"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { BatchHistoryDialog } from "./batch-history-dialog";
import type { FabricStockSummary, InventoryBatchWithPO } from "@/domain/inventory";

type Props = {
  summaries: FabricStockSummary[];
  batchesByFabric: Record<string, InventoryBatchWithPO[]>;
};

type StockStatus = "empty" | "low" | "ok" | "none";

function getStockStatus(summary: FabricStockSummary): StockStatus {
  if (summary.batchCount === 0) return "none";
  if (summary.totalQuantityLeft === 0) return "empty";
  if (summary.totalQuantityIn > 0 && summary.totalQuantityLeft / summary.totalQuantityIn <= 0.2) return "low";
  return "ok";
}

export function StockSummaryTable({ summaries, batchesByFabric }: Props) {
  const t = useTranslations("inventory");

  const [selectedFabric, setSelectedFabric] = useState<FabricStockSummary | null>(null);

  function unitLabel(unit: string) {
    return unit === "METERS" ? t("unitMeters") : t("unitRolls");
  }

  if (summaries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title={t("noStock")}
        description={t("noStockDesc")}
      />
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[80px]">{t("fabricCode")}</TableHead>
              <TableHead className="min-w-[150px]">{t("fabric")}</TableHead>
              <TableHead>{t("unit")}</TableHead>
              <TableHead className="text-end">{t("totalIn")}</TableHead>
              <TableHead className="text-end">{t("totalLeft")}</TableHead>
              <TableHead className="text-center">{t("batches")}</TableHead>
              <TableHead>{t("stockStatus")}</TableHead>
              <TableHead className="text-end"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((summary) => {
              const status = getStockStatus(summary);
              return (
                <TableRow key={summary.fabricId} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{summary.codeRef}</TableCell>
                  <TableCell>
                    <div className="font-medium">{summary.nameEn}</div>
                    {summary.nameAr && (
                      <div className="text-sm text-muted-foreground" dir="rtl">{summary.nameAr}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{unitLabel(summary.unit)}</Badge>
                  </TableCell>
                  <TableCell className="text-end text-muted-foreground">
                    {summary.batchCount > 0 ? summary.totalQuantityIn.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-end font-medium">
                    {summary.batchCount > 0 ? summary.totalQuantityLeft.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{summary.batchCount}</Badge>
                  </TableCell>
                  <TableCell>
                    {status === "empty" && (
                      <Badge variant="destructive">{t("statusEmpty")}</Badge>
                    )}
                    {status === "low" && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        {t("statusLow")}
                      </Badge>
                    )}
                    {status === "ok" && (
                      <Badge variant="default">{t("statusOk")}</Badge>
                    )}
                    {status === "none" && (
                      <span className="text-sm text-muted-foreground">{t("statusNone")}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    {summary.batchCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFabric(summary)}
                      >
                        <History className="h-4 w-4 me-1" />
                        {t("viewBatches")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedFabric && (
        <BatchHistoryDialog
          open={!!selectedFabric}
          onOpenChange={(open) => { if (!open) setSelectedFabric(null); }}
          fabricName={selectedFabric.nameEn}
          unit={selectedFabric.unit}
          batches={batchesByFabric[selectedFabric.fabricId] ?? []}
        />
      )}
    </>
  );
}
