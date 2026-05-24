"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { Truck, Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useTableSort } from "@/lib/use-table-sort";
import { SortableHead } from "@/components/ui/sortable-head";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TablePagination } from "@/components/ui/table-pagination";
import { VendorFormDialog } from "./vendor-form-dialog";
import { deleteVendorAction } from "@/app/[locale]/(dashboard)/vendors/actions";
import type { VendorSummary } from "@/domain/vendor";

type Props = { vendors: VendorSummary[] };

export function VendorsTable({ vendors }: Props) {
  const t = useTranslations("vendors");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");

  type VendorSortKey = "nameEn" | "phone" | "fabrics" | "orders" | "createdAt";
  const { sorted: sortedVendors, sort, toggle } = useTableSort<VendorSummary, VendorSortKey>(
    vendors,
    (v, key) => {
      if (key === "nameEn") return v.nameEn;
      if (key === "phone") return v.phone ?? "";
      if (key === "fabrics") return v._count.fabricVendors;
      if (key === "orders") return v._count.purchaseOrders;
      if (key === "createdAt") return new Date(v.createdAt);
      return null;
    },
    { key: "createdAt", dir: "desc" }
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const base = q
      ? sortedVendors.filter(
          (v) =>
            v.nameEn.toLowerCase().includes(q) ||
            (v.nameAr ?? "").toLowerCase().includes(q) ||
            (v.phone ?? "").toLowerCase().includes(q) ||
            (v.email ?? "").toLowerCase().includes(q)
        )
      : sortedVendors;

    return [...base].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return dateSort === "newest" ? -diff : diff;
    });
  }, [sortedVendors, search, dateSort]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasFilters = search !== "";

  function clearFilters() {
    setSearch("");
    setPage(1);
  }

  function handleEdit(vendor: VendorSummary) {
    setEditVendor(vendor);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteVendorAction(deleteTarget.id);
      if (result.success) {
        toast.success(t("deletedSuccess"));
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="ps-9"
            placeholder={tc("search")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={dateSort} onValueChange={(v) => { setDateSort(v as "newest" | "oldest"); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
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
        <Button className="ms-auto" onClick={() => { setEditVendor(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 me-2" />
          {t("new")}
        </Button>
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={t("noVendors")}
          description={t("noVendorsDesc")}
          action={
            <Button onClick={() => { setEditVendor(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 me-2" />
              {t("new")}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={tc("noResults")}
          description={tc("tryDifferentFilter")}
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead sortKey="nameEn" sort={sort} onToggle={toggle} className="min-w-[160px]">{t("nameEn")} / {t("nameAr")}</SortableHead>
                <SortableHead sortKey="phone" sort={sort} onToggle={toggle} className="min-w-[120px]">{t("phone")}</SortableHead>
                <TableHead className="min-w-[160px]">{t("email")}</TableHead>
                <SortableHead sortKey="fabrics" sort={sort} onToggle={toggle} className="text-center">{t("fabrics")}</SortableHead>
                <SortableHead sortKey="orders" sort={sort} onToggle={toggle} className="text-center">{t("orders")}</SortableHead>
                <SortableHead sortKey="createdAt" sort={sort} onToggle={toggle} className="min-w-[110px]">{t("created")}</SortableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((vendor) => (
                <TableRow
                  key={vendor.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/${locale}/vendors/${vendor.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{vendor.nameEn}</div>
                    {vendor.nameAr && (
                      <div className="text-sm text-muted-foreground" dir="rtl">{vendor.nameAr}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {vendor.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {vendor.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{vendor._count.fabricVendors}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={vendor._count.purchaseOrders > 0 ? "default" : "secondary"}>
                      {vendor._count.purchaseOrders}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(vendor.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${vendor.nameEn}`} onClick={() => handleEdit(vendor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${vendor.nameEn}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(vendor)}
                      >
                        <Trash2 className="h-4 w-4" />
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

      <VendorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vendor={editVendor ?? undefined}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")} &ldquo;{deleteTarget?.nameEn}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
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
