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
import { hotelSchema, type HotelFormValues } from "@/application/hotels/schemas";
import { createHotelAction, updateHotelAction } from "@/app/[locale]/(dashboard)/hotels/actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel?: { id: string; nameEn: string; nameAr: string };
};

export function HotelFormDialog({ open, onOpenChange, hotel }: Props) {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!hotel;

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema),
    defaultValues: { nameEn: hotel?.nameEn ?? "", nameAr: hotel?.nameAr ?? "" },
  });

  function onSubmit(values: HotelFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateHotelAction(hotel.id, values)
        : await createHotelAction(values);

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
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameEn")}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Four Seasons Cairo" {...field} />
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
                    <Input dir="rtl" placeholder="مثال: فور سيزونز القاهرة" {...field} />
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
