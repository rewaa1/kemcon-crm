"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, UserRound, Phone, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  addVendorContactAction,
  updateVendorContactAction,
  deleteVendorContactAction,
} from "@/app/[locale]/(dashboard)/vendors/[id]/actions";
import { vendorContactSchema, type VendorContactFormValues } from "@/application/vendors/schemas";
import type { VendorContact } from "@/domain/vendor";

type Props = { vendorId: string; contacts: VendorContact[] };

function toWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function VendorContactsTab({ vendorId, contacts }: Props) {
  const t = useTranslations("vendors");
  const tc = useTranslations("common");

  const [formOpen, setFormOpen] = useState(false);
  const [editContact, setEditContact] = useState<VendorContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorContact | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<VendorContactFormValues>({
    resolver: zodResolver(vendorContactSchema),
    defaultValues: { nameEn: "", nameAr: "", role: "", phone: "", email: "", isPrimary: false },
  });

  function openCreate() {
    setEditContact(null);
    form.reset({ nameEn: "", nameAr: "", role: "", phone: "", email: "", isPrimary: false });
    setFormOpen(true);
  }

  function openEdit(contact: VendorContact) {
    setEditContact(contact);
    form.reset({
      nameEn: contact.nameEn,
      nameAr: contact.nameAr ?? "",
      role: contact.role ?? "",
      phone: contact.phone ?? "",
      email: contact.email ?? "",
      isPrimary: contact.isPrimary,
    });
    setFormOpen(true);
  }

  function handleSubmit(values: VendorContactFormValues) {
    startTransition(async () => {
      const result = editContact
        ? await updateVendorContactAction(vendorId, editContact.id, values)
        : await addVendorContactAction(vendorId, values);
      if (result.success) {
        toast.success(editContact ? t("contactUpdatedSuccess") : t("contactAddedSuccess"));
        setFormOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteVendorContactAction(vendorId, deleteTarget.id);
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
        <Button size="sm" onClick={openCreate}>
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
                <TableHead>{t("contactName")}</TableHead>
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
                  <TableCell>
                    <div className="font-medium">{contact.nameEn}</div>
                    {contact.nameAr && (
                      <div className="text-sm text-muted-foreground" dir="rtl">{contact.nameAr}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.role ?? "—"}</TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                          title="Call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {contact.phone}
                        </a>
                        <a
                          href={toWhatsApp(contact.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 ms-1"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.isPrimary && (
                      <Badge variant="default" className="text-xs">{t("primary")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(contact)}>
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

      {/* Add/Edit contact dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!isPending) setFormOpen(o); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editContact ? t("editContact") : t("addContact")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("nameEn")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("nameAr")}</FormLabel>
                      <FormControl><Input dir="rtl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("role")}</FormLabel>
                    <FormControl><Input placeholder={t("rolePlaceholder")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phone")}</FormLabel>
                      <FormControl><Input type="tel" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">{t("isPrimary")}</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? tc("saving") : tc("save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
