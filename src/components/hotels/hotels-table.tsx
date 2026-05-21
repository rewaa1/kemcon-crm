"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { Building2, Plus, Eye, Pencil, Trash2 } from "lucide-react";
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
import { HotelFormDialog } from "./hotel-form-dialog";
import { deleteHotelAction } from "@/app/[locale]/(dashboard)/hotels/actions";
import type { HotelSummary } from "@/domain/hotel";

type Props = { hotels: HotelSummary[] };

export function HotelsTable({ hotels }: Props) {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");
  const locale = useLocale();

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
                <TableHead className="min-w-[160px]">{t("nameEn")} / {t("nameAr")}</TableHead>
                <TableHead className="text-center">{t("locations")}</TableHead>
                <TableHead className="text-center">{t("contacts")}</TableHead>
                <TableHead className="text-center">{t("projects")}</TableHead>
                <TableHead className="min-w-[110px]">{t("created")}</TableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotels.map((hotel) => (
                <TableRow key={hotel.id} className="hover:bg-muted/50">
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
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/${locale}/hotels/${hotel.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(hotel)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
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
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
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
