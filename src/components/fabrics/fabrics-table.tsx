"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
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
import { FabricFormDialog } from "./fabric-form-dialog";
import { deleteFabricAction } from "@/app/[locale]/(dashboard)/inventory/actions";
import type { FabricSummary } from "@/domain/fabric";

type VendorOption = { id: string; nameEn: string; nameAr: string | null };
type Props = { fabrics: FabricSummary[]; vendors: VendorOption[] };

export function FabricsTable({ fabrics, vendors }: Props) {
  const t = useTranslations("fabrics");
  const tc = useTranslations("common");

  const [formOpen, setFormOpen] = useState(false);
  const [editFabric, setEditFabric] = useState<FabricSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FabricSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit(fabric: FabricSummary) {
    setEditFabric(fabric);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteFabricAction(deleteTarget.id);
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
        <Button onClick={() => { setEditFabric(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 me-2" />
          {t("new")}
        </Button>
      </div>

      {fabrics.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("noFabrics")}
          description={t("noFabricsDesc")}
          action={
            <Button onClick={() => { setEditFabric(null); setFormOpen(true); }}>
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
                <TableHead className="min-w-[80px]">{t("codeRef")}</TableHead>
                <TableHead className="min-w-[160px]">{t("nameEn")} / {t("nameAr")}</TableHead>
                <TableHead>{t("unit")}</TableHead>
                <TableHead className="text-center">{t("vendors")}</TableHead>
                <TableHead className="text-center">{t("projects")}</TableHead>
                <TableHead className="min-w-[110px]">{t("created")}</TableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fabrics.map((fabric) => (
                <TableRow key={fabric.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{fabric.codeRef}</TableCell>
                  <TableCell>
                    <div className="font-medium">{fabric.nameEn}</div>
                    {fabric.nameAr && (
                      <div className="text-sm text-muted-foreground" dir="rtl">{fabric.nameAr}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {fabric.unit === "METERS" ? t("unitMeters") : t("unitRolls")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{fabric._count.vendors}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={fabric._count.projectItems > 0 ? "default" : "secondary"}>
                      {fabric._count.projectItems}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(fabric.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(fabric)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(fabric)}
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

      <FabricFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditFabric(null);
        }}
        fabric={editFabric ?? undefined}
        vendors={vendors}
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
