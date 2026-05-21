"use client";

import { useTransition, useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
import { projectItemSchema, type ProjectItemFormValues } from "@/application/projects/schemas";
import { addProjectItemAction } from "@/app/[locale]/(dashboard)/projects/[id]/actions";
import type { FabricSummary } from "@/domain/fabric";
import type { HotelLocation } from "@/domain/hotel";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  fabrics: FabricSummary[];
  locations: HotelLocation[];
};

export function AddProjectItemDialog({ open, onOpenChange, projectId, fabrics, locations }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProjectItemFormValues>({
    resolver: zodResolver(projectItemSchema) as Resolver<ProjectItemFormValues>,
    defaultValues: {
      fabricId: "",
      itemTypeEn: "",
      itemTypeAr: "",
      locationId: "",
      locationNoteEn: "",
      quantityNeeded: 0,
      unit: "METERS",
      source: "INVENTORY",
      notes: "",
    },
  });

  const fabricId = useWatch({ control: form.control, name: "fabricId" });
  const selectedFabric = fabrics.find((f) => f.id === fabricId);

  useEffect(() => {
    if (selectedFabric) {
      form.setValue("unit", selectedFabric.unit as "METERS" | "ROLLS");
    }
  }, [fabricId]);

  function onSubmit(values: ProjectItemFormValues) {
    startTransition(async () => {
      const result = await addProjectItemAction(projectId, values);
      if (result.success) {
        toast.success(t("itemAddedSuccess"));
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  const unitLabel = selectedFabric?.unit === "ROLLS" ? t("unitRolls") : t("unitMeters");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addItem")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fabricId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fabric")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectFabric")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fabrics.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          <span className="font-mono me-2 text-muted-foreground">{f.codeRef}</span>
                          {f.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <Input dir="rtl" placeholder="مثال: ستائر" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantityNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quantityNeeded")} ({unitLabel})</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.001" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sourceLabel")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INVENTORY">{t("source.INVENTORY")}</SelectItem>
                        <SelectItem value="CLIENT">{t("source.CLIENT")}</SelectItem>
                        <SelectItem value="DIRECT">{t("source.DIRECT")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {locations.length > 0 && (
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("location")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Input placeholder={t("locationNotePlaceholder")} {...field} />
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
                    <Textarea rows={2} placeholder={t("notesPlaceholder")} {...field} />
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
                {isPending ? tc("saving") : tc("add")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
