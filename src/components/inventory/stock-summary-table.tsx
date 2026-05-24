"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { History, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { BatchHistoryDialog } from "./batch-history-dialog";
import type { FabricStockSummary, InventoryBatchWithPO } from "@/domain/inventory";

type Props = {
  summaries: FabricStockSummary[];
  batchesByFabric: Record<string, InventoryBatchWithPO[]>;
  initialFilterStatus?: StockStatus | "all";
};

type StockStatus = "empty" | "low" | "ok" | "none";

function getStockStatus(summary: FabricStockSummary): StockStatus {
  if (summary.batchCount === 0) return "none";
  if (summary.totalQuantityLeft === 0) return "empty";
  if (summary.totalQuantityIn > 0 && summary.totalQuantityLeft / summary.totalQuantityIn <= 0.2) return "low";
  return "ok";
}

type SortOption = "nameAsc" | "nameDesc" | "stockHigh" | "stockLow";

export function StockSummaryTable({ summaries, batchesByFabric, initialFilterStatus = "all" }: Props) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StockStatus | "all">(initialFilterStatus);
  const [sortBy, setSortBy] = useState<SortOption>("nameAsc");
  const [selectedFabric, setSelectedFabric] = useState<FabricStockSummary | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    const base = summaries.filter((s) => {
      if (q && !s.nameEn.toLowerCase().includes(q) && !(s.nameAr ?? "").toLowerCase().includes(q) && !s.codeRef.toLowerCase().includes(q)) return false;
      if (filterStatus !== "all" && getStockStatus(s) !== filterStatus) return false;
      return true;
    });

    return [...base].sort((a, b) => {
      if (sortBy === "nameAsc") return a.nameEn.localeCompare(b.nameEn);
      if (sortBy === "nameDesc") return b.nameEn.localeCompare(a.nameEn);
      if (sortBy === "stockHigh") return b.totalQuantityLeft - a.totalQuantityLeft;
      if (sortBy === "stockLow") return a.totalQuantityLeft - b.totalQuantityLeft;
      return 0;
    });
  }, [summaries, search, filterStatus, sortBy]);

  const hasFilters = search !== "" || filterStatus !== "all";

  function clearFilters() {
    setSearch("");
    setFilterStatus("all");
  }

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
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="ps-9"
            placeholder={t("searchFabric")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StockStatus | "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("filterAllStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAllStatuses")}</SelectItem>
            <SelectItem value="ok">{t("statusOk")}</SelectItem>
            <SelectItem value="low">{t("statusLow")}</SelectItem>
            <SelectItem value="empty">{t("statusEmpty")}</SelectItem>
            <SelectItem value="none">{t("statusNone")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nameAsc">{t("sortNameAsc")}</SelectItem>
            <SelectItem value="nameDesc">{t("sortNameDesc")}</SelectItem>
            <SelectItem value="stockHigh">{t("sortStockHigh")}</SelectItem>
            <SelectItem value="stockLow">{t("sortStockLow")}</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 me-1" />
            {tc("clearFilters")}
          </Button>
        )}
        <span className="ms-auto text-sm text-muted-foreground">
          {filtered.length} {tc("of")} {summaries.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title={tc("noResults")}
          description={tc("tryDifferentFilter")}
        />
      ) : (
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
              {filtered.map((summary) => {
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
      )}

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
