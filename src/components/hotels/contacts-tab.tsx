"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, UserRound } from "lucide-react";
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
import { ContactFormDialog } from "./contact-form-dialog";
import { deleteContactAction } from "@/app/[locale]/(dashboard)/hotels/[id]/actions";
import type { HotelContact } from "@/domain/hotel";

type Props = { hotelId: string; contacts: HotelContact[] };

export function ContactsTab({ hotelId, contacts }: Props) {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");
  const [formOpen, setFormOpen] = useState(false);
  const [editContact, setEditContact] = useState<HotelContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HotelContact | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteContactAction(hotelId, deleteTarget.id);
      if (result.success) {
        toast.success(t("contactDeletedSuccess"));
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => { setEditContact(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 me-2" />
          {t("addContact")}
        </Button>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={t("noContacts")}
          description={t("noContactsDesc")}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("nameEn")}</TableHead>
                <TableHead>{t("nameAr")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead></TableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.nameEn}</TableCell>
                  <TableCell dir="rtl" className="text-muted-foreground">
                    {contact.nameAr ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.role ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.email ?? "—"}</TableCell>
                  <TableCell>
                    {contact.isPrimary && (
                      <Badge variant="default" className="text-xs">{t("primary")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditContact(contact); setFormOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(contact)}
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

      <ContactFormDialog
        hotelId={hotelId}
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editContact ?? undefined}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteContact")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteContactConfirm")}</AlertDialogDescription>
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
