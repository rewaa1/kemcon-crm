"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Truck, Plus, Pencil, Trash2 } from "lucide-react";
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
import { VendorFormDialog } from "./vendor-form-dialog";
import { deleteVendorAction } from "@/app/[locale]/(dashboard)/vendors/actions";
import type { VendorSummary } from "@/domain/vendor";

type Props = { vendors: VendorSummary[] };

export function VendorsTable({ vendors }: Props) {
  const t = useTranslations("vendors");
  const tc = useTranslations("common");

  const [formOpen, setFormOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorSummary | null>(null);
  const [isPending, startTransition] = useTransition();

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
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditVendor(null); setFormOpen(true); }}>
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
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">{t("nameEn")} / {t("nameAr")}</TableHead>
                <TableHead className="min-w-[120px]">{t("phone")}</TableHead>
                <TableHead className="min-w-[160px]">{t("email")}</TableHead>
                <TableHead className="text-center">{t("fabrics")}</TableHead>
                <TableHead className="text-center">{t("orders")}</TableHead>
                <TableHead className="min-w-[110px]">{t("created")}</TableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id} className="hover:bg-muted/50">
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
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(vendor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
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
