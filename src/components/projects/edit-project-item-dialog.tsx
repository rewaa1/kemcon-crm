"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateProjectItemAction } from "@/app/[locale]/(dashboard)/projects/[id]/actions";
import type { ProjectItem } from "@/domain/project";
import type { HotelLocation } from "@/domain/hotel";

const schema = z.object({
  itemTypeEn: z.string().min(1, "Item type is required"),
  itemTypeAr: z.string().optional(),
  locationId: z.string().optional(),
  locationNoteEn: z.string().optional(),
  quantityNeeded: z.coerce.number().positive("Must be greater than 0"),
  notes: z.string().optional(),
});

type FormValues = z.output<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  item: ProjectItem;
  locations: HotelLocation[];
};

export function EditProjectItemDialog({ open, onOpenChange, projectId, item, locations }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const fabricName = item.fabric?.nameEn ?? item.customFabricName ?? "—";
  const unitLabel = item.unit === "METERS" ? t("unitMeters") : t("unitRolls");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      itemTypeEn: item.itemTypeEn,
      itemTypeAr: item.itemTypeAr ?? "",
      locationId: item.locationId ?? "",
      locationNoteEn: item.locationNoteEn ?? "",
      quantityNeeded: item.quantityNeeded,
      notes: item.notes ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateProjectItemAction(projectId, item.id, {
        itemTypeEn: values.itemTypeEn,
        itemTypeAr: values.itemTypeAr,
        locationId: values.locationId || undefined,
        locationNoteEn: values.locationNoteEn,
        quantityNeeded: values.quantityNeeded,
        notes: values.notes,
      });
      if (result.success) {
        toast.success(t("itemUpdatedSuccess"));
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("editItem")}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          {fabricName} · {t(`source.${item.source}`)}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="itemTypeEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("itemTypeEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("itemTypePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="itemTypeAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("itemTypeAr")}</FormLabel>
                    <FormControl>
                      <Input dir="rtl" placeholder="مثال: ستائر" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="quantityNeeded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("quantityNeeded")} ({unitLabel})</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {locations.length > 0 && (
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("location")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectLocation")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.nameEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="locationNoteEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("locationNote")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("locationNotePlaceholder")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder={t("notesPlaceholder")} {...field} value={field.value ?? ""} />
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
                {isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
