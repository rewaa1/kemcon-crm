"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { ShoppingCart, Eye, Search, X } from "lucide-react";
import { useTableSort } from "@/lib/use-table-sort";
import { SortableHead } from "@/components/ui/sortable-head";
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
import { TablePagination } from "@/components/ui/table-pagination";
import type { PurchaseOrderSummary, PurchaseOrderStatus } from "@/domain/purchase-order";
import { PO_STATUS_VARIANT } from "@/lib/status-variants";

type Props = { orders: PurchaseOrderSummary[]; locale: string; initialDueToday?: boolean };

export function PurchaseOrdersTable({ orders, locale, initialDueToday = false }: Props) {
  const t = useTranslations("purchaseOrders");
  const tc = useTranslations("common");

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialDueToday ? "PENDING" : "all");
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterDueToday, setFilterDueToday] = useState(initialDueToday);
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");

  const uniqueVendors = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => map.set(o.vendor.id, o.vendor.nameEn));
    return Array.from(map.entries()).map(([id, nameEn]) => ({ id, nameEn }));
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return orders.filter((o) => {
      if (q && !o.poNumber.toLowerCase().includes(q) && !o.vendor.nameEn.toLowerCase().includes(q)) return false;
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (filterVendor !== "all" && o.vendor.id !== filterVendor) return false;
      if (filterDueToday) {
        if (!o.expectedAt) return false;
        if (new Date(o.expectedAt) > todayEnd) return false;
      }
      return true;
    });
  }, [orders, search, filterStatus, filterVendor, filterDueToday]);

  type POSortKey = "poNumber" | "vendor" | "status" | "lines" | "orderedAt" | "expectedAt" | "totalValue";
  const { sorted: sortedOrders, sort, toggle, setSort } = useTableSort<PurchaseOrderSummary, POSortKey>(
    filtered,
    (o, key) => {
      if (key === "poNumber") return o.poNumber;
      if (key === "vendor") return o.vendor.nameEn;
      if (key === "status") return o.status;
      if (key === "lines") return o._count.lines;
      if (key === "orderedAt") return new Date(o.orderedAt);
      if (key === "expectedAt") return o.expectedAt ? new Date(o.expectedAt) : null;
      if (key === "totalValue") return o.totalValue;
      return null;
    },
    { key: "orderedAt", dir: "desc" }
  );

  function handleDateSort(v: "newest" | "oldest") {
    setDateSort(v);
    setSort({ key: "orderedAt", dir: v === "newest" ? "desc" : "asc" });
    setPage(1);
  }

  const hasFilters = search !== "" || filterStatus !== "all" || filterVendor !== "all" || filterDueToday;
  const paginated = useMemo(() => sortedOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sortedOrders, page]);

  function clearFilters() {
    setSearch("");
    setFilterStatus("all");
    setFilterVendor("all");
    setFilterDueToday(false);
    setPage(1);
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={t("noOrders")}
        description={t("noOrdersDesc")}
        action={
          <Button asChild>
            <Link href={`/${locale}/purchase-orders/new`}>{t("new")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="ps-9"
            placeholder={tc("search")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("filterAllStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAllStatuses")}</SelectItem>
            {(["PENDING", "RECEIVED", "PARTIAL", "CANCELLED"] as PurchaseOrderStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterVendor} onValueChange={(v) => { setFilterVendor(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filterAllVendors")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAllVendors")}</SelectItem>
            {uniqueVendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.nameEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={filterDueToday ? "secondary" : "outline"}
          size="sm"
          className={filterDueToday ? "border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300" : ""}
          onClick={() => { setFilterDueToday((v) => !v); setPage(1); }}
        >
          {t("filterDueToday")}
        </Button>
        <Select value={dateSort} onValueChange={(v) => handleDateSort(v as "newest" | "oldest")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{tc("sortNewest")}</SelectItem>
            <SelectItem value="oldest">{tc("sortOldest")}</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 me-1" />
            {tc("clearFilters")}
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={tc("noResults")} description={tc("tryDifferentFilter")} />
      ) : (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead sortKey="poNumber" sort={sort} onToggle={toggle} className="min-w-[110px]">{t("poNumber")}</SortableHead>
              <SortableHead sortKey="vendor" sort={sort} onToggle={toggle} className="min-w-[140px]">{t("vendor")}</SortableHead>
              <SortableHead sortKey="status" sort={sort} onToggle={toggle}>{tc("status")}</SortableHead>
              <SortableHead sortKey="lines" sort={sort} onToggle={toggle} className="text-center">{t("lines")}</SortableHead>
              <SortableHead sortKey="orderedAt" sort={sort} onToggle={toggle} className="min-w-[110px]">{t("orderedAt")}</SortableHead>
              <SortableHead sortKey="expectedAt" sort={sort} onToggle={toggle} className="min-w-[110px]">{t("expectedAt")}</SortableHead>
              <SortableHead sortKey="totalValue" sort={sort} onToggle={toggle} className="text-end min-w-[110px]">{t("totalValue")}</SortableHead>
              <TableHead className="text-end">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((order) => (
            <TableRow key={order.id} className="hover:bg-muted/50">
              <TableCell className="font-mono font-medium">{order.poNumber}</TableCell>
              <TableCell>
                <div>{order.vendor.nameEn}</div>
                {order.vendor.nameAr && (
                  <div className="text-sm text-muted-foreground" dir="rtl">{order.vendor.nameAr}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={PO_STATUS_VARIANT[order.status]}>
                  {t(`status.${order.status}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{order._count.lines}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(order.orderedAt), "dd MMM yyyy")}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {order.expectedAt ? format(new Date(order.expectedAt), "dd MMM yyyy") : "—"}
              </TableCell>
              <TableCell className="text-end font-mono text-sm font-medium">
                {order.totalValue.toLocaleString()} EGP
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" aria-label={`View ${order.poNumber}`} asChild>
                    <Link href={`/${locale}/purchase-orders/${order.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
        <TablePagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>
      )}
    </div>
  );
}
