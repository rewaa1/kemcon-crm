"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { contactSchema, type ContactFormValues } from "@/application/hotels/schemas";
import {
  addContactAction,
  updateContactAction,
} from "@/app/[locale]/(dashboard)/hotels/[id]/actions";
import type { HotelContact } from "@/domain/hotel";

type Props = {
  hotelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: HotelContact;
};

export function ContactFormDialog({ hotelId, open, onOpenChange, contact }: Props) {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!contact;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nameEn: contact?.nameEn ?? "",
      nameAr: contact?.nameAr ?? "",
      role: contact?.role ?? "",
      phone: contact?.phone ?? "",
      email: contact?.email ?? "",
      isPrimary: contact?.isPrimary ?? false,
    },
  });

  function onSubmit(values: ContactFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateContactAction(hotelId, contact.id, values)
        : await addContactAction(hotelId, values);

      if (result.success) {
        toast.success(isEdit ? t("contactUpdatedSuccess") : t("contactAddedSuccess"));
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editContact") : t("addContact")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nameEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input dir="rtl" placeholder="جون سميث" {...field} />
                    </FormControl>
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
                  <FormControl>
                    <Input placeholder="e.g. Procurement Manager" {...field} />
                  </FormControl>
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
                    <FormControl>
                      <Input placeholder="+20 1XX XXX XXXX" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input type="email" placeholder="name@hotel.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                  </FormControl>
                  <FormLabel htmlFor="isPrimary" className="!mt-0 cursor-pointer">
                    {t("isPrimary")}
                  </FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? tc("saving") : tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
