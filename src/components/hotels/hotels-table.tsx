"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { format } from "date-fns";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { useTableSort } from "@/lib/use-table-sort";
import { SortableHead } from "@/components/ui/sortable-head";
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
import { TablePagination } from "@/components/ui/table-pagination";
import { HotelFormDialog } from "./hotel-form-dialog";
import { deleteHotelAction } from "@/app/[locale]/(dashboard)/hotels/actions";
import type { HotelSummary } from "@/domain/hotel";

type Props = { hotels: HotelSummary[] };

export function HotelsTable({ hotels }: Props) {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");
  const locale = useLocale();

  const router = useRouter();
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);

  type HotelSortKey = "nameEn" | "locations" | "contacts" | "projects" | "createdAt";
  const { sorted: sortedHotels, sort, toggle } = useTableSort<HotelSummary, HotelSortKey>(
    hotels,
    (h, key) => {
      if (key === "nameEn") return h.nameEn;
      if (key === "locations") return h._count.locations;
      if (key === "contacts") return h._count.contacts;
      if (key === "projects") return h._count.projects;
      if (key === "createdAt") return new Date(h.createdAt);
      return null;
    }
  );

  const paginated = useMemo(() => sortedHotels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sortedHotels, page]);
  const [formOpen, setFormOpen] = useState(false);
  const [editHotel, setEditHotel] = useState<HotelSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HotelSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit(hotel: HotelSummary) {
    setEditHotel(hotel);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteHotelAction(deleteTarget.id);
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
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditHotel(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 me-2" />
          {t("new")}
        </Button>
      </div>

      {hotels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("noHotels")}
          description={t("noHotelsDesc")}
          action={
            <Button onClick={() => { setEditHotel(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 me-2" />
              {t("new")}
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead sortKey="nameEn" sort={sort} onToggle={toggle} className="min-w-[160px]">{t("nameEn")} / {t("nameAr")}</SortableHead>
                <SortableHead sortKey="locations" sort={sort} onToggle={toggle} className="text-center">{t("locations")}</SortableHead>
                <SortableHead sortKey="contacts" sort={sort} onToggle={toggle} className="text-center">{t("contacts")}</SortableHead>
                <SortableHead sortKey="projects" sort={sort} onToggle={toggle} className="text-center">{t("projects")}</SortableHead>
                <SortableHead sortKey="createdAt" sort={sort} onToggle={toggle} className="min-w-[110px]">{t("created")}</SortableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((hotel) => (
                <TableRow
                key={hotel.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/${locale}/hotels/${hotel.id}`)}
              >
                  <TableCell>
                    <div className="font-medium">{hotel.nameEn}</div>
                    <div className="text-sm text-muted-foreground" dir="rtl">{hotel.nameAr}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{hotel._count.locations}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{hotel._count.contacts}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={hotel._count.projects > 0 ? "default" : "secondary"}>
                      {hotel._count.projects}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(hotel.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${hotel.nameEn}`} onClick={() => handleEdit(hotel)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${hotel.nameEn}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(hotel)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} pageSize={PAGE_SIZE} total={sortedHotels.length} onPageChange={setPage} />
        </div>
      )}

      <HotelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        hotel={editHotel ?? undefined}
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
