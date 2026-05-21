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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { fabricSchema, type FabricFormValues } from "@/application/fabrics/schemas";
import { createFabricAction, updateFabricAction } from "@/app/[locale]/(dashboard)/inventory/actions";
import type { FabricSummary } from "@/domain/fabric";

type VendorOption = { id: string; nameEn: string; nameAr: string | null };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabric?: FabricSummary;
  vendors: VendorOption[];
};

export function FabricFormDialog({ open, onOpenChange, fabric, vendors }: Props) {
  const t = useTranslations("fabrics");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!fabric;

  const form = useForm<FabricFormValues>({
    resolver: zodResolver(fabricSchema),
    defaultValues: {
      codeRef: fabric?.codeRef ?? "",
      nameEn: fabric?.nameEn ?? "",
      nameAr: fabric?.nameAr ?? "",
      description: "",
      unit: fabric?.unit ?? "METERS",
      vendorIds: fabric?.vendors.map((v) => v.vendorId) ?? [],
    },
  });

  function onSubmit(values: FabricFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateFabricAction(fabric.id, values)
        : await createFabricAction(values);

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("new")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codeRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("codeRef")}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. FAB-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("unit")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="METERS">{t("unitMeters")}</SelectItem>
                        <SelectItem value="ROLLS">{t("unitRolls")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nameEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Velvet Curtain" {...field} />
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
                      <Input dir="rtl" placeholder="مثال: ستارة مخمل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder={t("descriptionPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {vendors.length > 0 && (
              <FormField
                control={form.control}
                name="vendorIds"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("vendors")}</FormLabel>
                    <div className="max-h-36 overflow-y-auto rounded-md border p-3 space-y-2">
                      {vendors.map((vendor) => (
                        <FormField
                          key={vendor.id}
                          control={form.control}
                          name="vendorIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(vendor.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? [];
                                    field.onChange(
                                      checked
                                        ? [...current, vendor.id]
                                        : current.filter((id) => id !== vendor.id)
                                    );
                                  }}
                                />
                              </FormControl>
                              <span className="text-sm">{vendor.nameEn}</span>
                              {vendor.nameAr && (
                                <span className="text-sm text-muted-foreground" dir="rtl">
                                  ({vendor.nameAr})
                                </span>
                              )}
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
