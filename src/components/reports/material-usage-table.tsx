"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { PackageSearch } from "lucide-react";
import type { MaterialUsageRow, ProjectStatus, SupplySource } from "@/domain/project";
import { PROJECT_STATUS_VARIANT } from "@/lib/status-variants";

type Props = {
  rows: MaterialUsageRow[];
  hotels: { id: string; nameEn: string }[];
};

const SOURCE_VARIANT: Record<SupplySource, "default" | "secondary" | "outline"> = {
  INVENTORY: "default",
  CLIENT: "secondary",
  DIRECT: "outline",
};

export function MaterialUsageTable({ rows, hotels }: Props) {
  const t = useTranslations("reports");
  const tp = useTranslations("projects");
  const tc = useTranslations("common");

  const [hotelId, setHotelId] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");

  const filtered = useMemo(() => {
    const base = rows.filter((row) => {
      if (hotelId !== "all" && row.hotelId !== hotelId) return false;
      if (status !== "all" && row.projectStatus !== status) return false;
      if (dateFrom && row.deliveryDate) {
        if (new Date(row.deliveryDate) < new Date(dateFrom)) return false;
      }
      if (dateTo && row.deliveryDate) {
        if (new Date(row.deliveryDate) > new Date(dateTo)) return false;
      }
      return true;
    });
    return [...base].sort((a, b) => {
      const ad = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
      const bd = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
      return dateSort === "newest" ? bd - ad : ad - bd;
    });
  }, [rows, hotelId, status, dateFrom, dateTo, dateSort]);

  const byFabric = useMemo(() => {
    const map = new Map<
      string,
      {
        fabricCodeRef: string;
        fabricNameEn: string;
        fabricNameAr: string | null;
        fabricUnit: string;
        totalQty: number;
        projectIds: Set<string>;
      }
    >();

    for (const row of filtered) {
      const key = row.fabricId ?? `custom:${row.fabricNameEn}`;
      if (!map.has(key)) {
        map.set(key, {
          fabricCodeRef: row.fabricCodeRef,
          fabricNameEn: row.fabricNameEn,
          fabricNameAr: row.fabricNameAr,
          fabricUnit: row.fabricUnit,
          totalQty: 0,
          projectIds: new Set(),
        });
      }
      const entry = map.get(key)!;
      entry.totalQty = parseFloat((entry.totalQty + row.quantityNeeded).toFixed(3));
      entry.projectIds.add(row.projectId);
    }

    return Array.from(map.entries())
      .map(([fabricId, v]) => ({ fabricId, ...v, projectCount: v.projectIds.size }))
      .sort((a, b) => b.totalQty - a.totalQty);
  }, [filtered]);

  const hasFilters = hotelId !== "all" || status !== "all" || dateFrom !== "" || dateTo !== "";

  function resetFilters() {
    setHotelId("all");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
  }

  function unitLabel(unit: string) {
    return unit === "METERS" ? t("unitMeters") : t("unitRolls");
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <Select value={hotelId} onValueChange={setHotelId}>
            <SelectTrigger>
              <SelectValue placeholder={t("filterHotel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterHotel")}</SelectItem>
              {hotels.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder={t("filterStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterStatus")}</SelectItem>
              {(["DRAFT", "CONFIRMED", "IN_PRODUCTION", "DELIVERED"] as ProjectStatus[]).map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {tp(`status.${s}`)}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground leading-none">{t("filterDateFrom")}</label>
            <Input
              type="date"
              className="w-[150px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <span className="text-muted-foreground text-sm mt-5">–</span>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground leading-none">{t("filterDateTo")}</label>
            <Input
              type="date"
              className="w-[150px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <Select value={dateSort} onValueChange={(v) => setDateSort(v as "newest" | "oldest")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{tc("sortNewest")}</SelectItem>
              <SelectItem value="oldest">{tc("sortOldest")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            {t("resetFilters")}
          </Button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} {t("rows")}
        </span>
      </div>

      {/* Views */}
      <Tabs defaultValue="detail">
        <TabsList>
          <TabsTrigger value="detail">{t("tabDetail")}</TabsTrigger>
          <TabsTrigger value="fabric">
            {t("tabFabric")} ({byFabric.length})
          </TabsTrigger>
        </TabsList>

        {/* Detail view — flat table */}
        <TabsContent value="detail" className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={t("noData")}
              description={t("noDataDesc")}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("project")}</TableHead>
                    <TableHead>{t("hotel")}</TableHead>
                    <TableHead>{t("fabric")}</TableHead>
                    <TableHead>{t("itemType")}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead>{t("source")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("deliveryDate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.projectItemId}>
                      <TableCell className="font-medium">{row.projectNameEn}</TableCell>
                      <TableCell className="text-muted-foreground">{row.hotelNameEn}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span>{row.fabricNameEn}</span>
                          <span className="text-xs text-muted-foreground">{row.fabricCodeRef}</span>
                        </div>
                      </TableCell>
                      <TableCell>{row.itemTypeEn}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.quantityNeeded} {unitLabel(row.fabricUnit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={SOURCE_VARIANT[row.source]}>
                          {tp(`source.${row.source}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={PROJECT_STATUS_VARIANT[row.projectStatus]}>
                          {tp(`status.${row.projectStatus}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.deliveryDate
                          ? format(new Date(row.deliveryDate), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Fabric summary view */}
        <TabsContent value="fabric" className="mt-4">
          {byFabric.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={t("noData")}
              description={t("noDataDesc")}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("fabricCode")}</TableHead>
                    <TableHead>{t("fabric")}</TableHead>
                    <TableHead className="text-right">{t("totalQty")}</TableHead>
                    <TableHead className="text-right">{t("projects")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byFabric.map((f) => (
                    <TableRow key={f.fabricId}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {f.fabricCodeRef}
                      </TableCell>
                      <TableCell className="font-medium">{f.fabricNameEn}</TableCell>
                      <TableCell className="text-right font-mono">
                        {f.totalQty} {unitLabel(f.fabricUnit)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {f.projectCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
