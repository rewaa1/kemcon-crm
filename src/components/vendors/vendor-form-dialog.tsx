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
import { vendorSchema, type VendorFormValues } from "@/application/vendors/schemas";
import { createVendorAction, updateVendorAction } from "@/app/[locale]/(dashboard)/vendors/actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: { id: string; nameEn: string; nameAr: string | null; phone: string | null; email: string | null; address: string | null };
};

export function VendorFormDialog({ open, onOpenChange, vendor }: Props) {
  const t = useTranslations("vendors");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!vendor;

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      nameEn: vendor?.nameEn ?? "",
      nameAr: vendor?.nameAr ?? "",
      phone: vendor?.phone ?? "",
      email: vendor?.email ?? "",
      address: vendor?.address ?? "",
    },
  });

  function onSubmit(values: VendorFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateVendorAction(vendor.id, values)
        : await createVendorAction(values);

      if (result.success) {
        toast.success(isEdit ? t("updatedSuccess") : t("createdSuccess"));
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("new")}</DialogTitle>
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
                      <Input placeholder="e.g. Cairo Fabrics Co." {...field} />
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
                      <Input dir="rtl" placeholder="مثال: شركة قماش القاهرة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+20 100 000 0000" {...field} />
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
                      <Input type="email" placeholder="vendor@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 15 Industrial Zone, Cairo" {...field} />
                  </FormControl>
                  <FormMessage />
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
