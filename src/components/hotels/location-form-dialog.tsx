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
import { locationSchema, type LocationFormValues } from "@/application/hotels/schemas";
import { addLocationAction } from "@/app/[locale]/(dashboard)/hotels/[id]/actions";

type Props = {
  hotelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LocationFormDialog({ hotelId, open, onOpenChange }: Props) {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: { nameEn: "", nameAr: "", address: "" },
  });

  function onSubmit(values: LocationFormValues) {
    startTransition(async () => {
      const result = await addLocationAction(hotelId, values);
      if (result.success) {
        toast.success(t("locationAddedSuccess"));
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
          <DialogTitle>{t("addLocation")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameEn")}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Branch" {...field} />
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
                    <Input dir="rtl" placeholder="مثال: الفرع الرئيسي" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address")} <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 35 Corniche El Nil, Cairo" {...field} />
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
