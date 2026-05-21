"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LocationFormDialog } from "./location-form-dialog";
import { deleteLocationAction } from "@/app/[locale]/(dashboard)/hotels/[id]/actions";
import type { HotelLocation } from "@/domain/hotel";

type Props = { hotelId: string; locations: HotelLocation[] };

export function LocationsTab({ hotelId, locations }: Props) {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HotelLocation | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteLocationAction(hotelId, deleteTarget.id);
      if (result.success) {
        toast.success(t("locationDeletedSuccess"));
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t("addLocation")}
        </Button>
      </div>

      {locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t("noLocations")}
          description={t("noLocationsDesc")}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("nameEn")}</TableHead>
                <TableHead>{t("nameAr")}</TableHead>
                <TableHead>{t("address")}</TableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.nameEn}</TableCell>
                  <TableCell dir="rtl" className="text-muted-foreground">{location.nameAr}</TableCell>
                  <TableCell className="text-muted-foreground">{location.address ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(location)}
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

      <LocationFormDialog
        hotelId={hotelId}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteLocation")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteLocationConfirm")}</AlertDialogDescription>
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
