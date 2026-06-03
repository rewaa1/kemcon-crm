"use client";

import { useTransition, useMemo, useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
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
  itemCount: z.coerce.number().int().positive().optional(),
  itemWidth: z.coerce.number().positive().optional(),
  itemHeight: z.coerce.number().positive().optional(),
  totalSupplied: z.coerce.number().positive().optional(),
  productionLoss: z.coerce.number().nonnegative().optional(),
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
  const isNonInventory = item.source === "CLIENT" || item.source === "DIRECT";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      itemTypeEn: item.itemTypeEn,
      itemTypeAr: item.itemTypeAr ?? "",
      locationId: item.locationId ?? "",
      locationNoteEn: item.locationNoteEn ?? "",
      quantityNeeded: item.quantityNeeded,
      notes: item.notes ?? "",
      itemCount: item.itemCount ?? undefined,
      itemWidth: item.itemWidth ?? undefined,
      itemHeight: item.itemHeight ?? undefined,
      totalSupplied: item.totalSupplied ?? undefined,
      productionLoss: item.productionLoss ?? undefined,
    },
  });

  const watchedItemCount = useWatch({ control: form.control, name: "itemCount" });
  const watchedWidth = useWatch({ control: form.control, name: "itemWidth" });
  const watchedHeight = useWatch({ control: form.control, name: "itemHeight" });
  const watchedTotalSupplied = useWatch({ control: form.control, name: "totalSupplied" });
  const watchedProductionLoss = useWatch({ control: form.control, name: "productionLoss" });

  const calculatedQty = useMemo(() => {
    const count = Number(watchedItemCount) || 0;
    const w = Number(watchedWidth) || 0;
    const h = Number(watchedHeight) || 0;
    if (count > 0 && w > 0 && h > 0) return parseFloat((count * w * h).toFixed(3));
    return null;
  }, [watchedItemCount, watchedWidth, watchedHeight]);

  // Leftovers = Total Supplied − Fabric Needed − Production Loss
  const calculatedLeftover = useMemo(() => {
    const supplied = Number(watchedTotalSupplied) || 0;
    const loss = Number(watchedProductionLoss) || 0;
    if (calculatedQty !== null && supplied > 0) {
      return parseFloat((supplied - calculatedQty - loss).toFixed(3));
    }
    return null;
  }, [calculatedQty, watchedTotalSupplied, watchedProductionLoss]);

  useEffect(() => {
    if (calculatedQty !== null && isNonInventory) {
      form.setValue("quantityNeeded", calculatedQty);
    }
  }, [calculatedQty]);

  const qtyAutoCalculated = isNonInventory && calculatedQty !== null;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateProjectItemAction(projectId, item.id, {
        itemTypeEn: values.itemTypeEn,
        itemTypeAr: values.itemTypeAr,
        locationId: values.locationId || undefined,
        locationNoteEn: values.locationNoteEn,
        quantityNeeded: values.quantityNeeded,
        notes: values.notes,
        itemCount: values.itemCount,
        ...(isNonInventory && {
          itemWidth: values.itemWidth,
          itemHeight: values.itemHeight,
          totalSupplied: values.totalSupplied,
          productionLoss: values.productionLoss,
          fabricLeftover: calculatedLeftover ?? undefined,
        }),
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[68vh] overflow-y-auto pe-0.5">
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

            {/* Piece count — applies to all sources; enables staged deliveries */}
            <FormField
              control={form.control}
              name="itemCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("wizard.itemCount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number" onWheel={(e) => e.currentTarget.blur()} min="1" step="1" placeholder="0"
                      className="max-w-40"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t("wizard.pieceCountHint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dimension fields — CLIENT / DIRECT only */}
            {isNonInventory && (
              <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("wizard.dimensionsLabel")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="itemWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("wizard.itemWidth")} (m)</FormLabel>
                        <FormControl>
                          <Input type="number" onWheel={(e) => e.currentTarget.blur()} min="0" step="0.001" placeholder="0.00" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="itemHeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("wizard.itemHeight")} (m)</FormLabel>
                        <FormControl>
                          <Input type="number" onWheel={(e) => e.currentTarget.blur()} min="0" step="0.001" placeholder="0.00" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="totalSupplied"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("wizard.totalSupplied")} ({unitLabel})</FormLabel>
                        <FormControl>
                          <Input type="number" onWheel={(e) => e.currentTarget.blur()} min="0" step="0.001" placeholder="0.000" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productionLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("wizard.productionLoss")} ({unitLabel})</FormLabel>
                        <FormControl>
                          <Input type="number" onWheel={(e) => e.currentTarget.blur()} min="0" step="0.001" placeholder="0.000" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {calculatedQty !== null && (
                  <div className="rounded-lg bg-muted/50 border px-3 py-2.5 space-y-1.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t("wizard.fabricNeeded")}</span>
                      <span className="font-semibold tabular-nums">
                        {calculatedQty.toLocaleString()} {unitLabel}
                      </span>
                    </div>
                    {Number(watchedProductionLoss) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("wizard.productionLoss")}</span>
                        <span className="font-semibold tabular-nums text-amber-600">
                          {Number(watchedProductionLoss).toLocaleString()} {unitLabel}
                        </span>
                      </div>
                    )}
                    {calculatedLeftover !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("wizard.fabricLeftover")}</span>
                        <span className={cn("font-semibold tabular-nums", calculatedLeftover < 0 ? "text-destructive" : "text-green-600")}>
                          {calculatedLeftover.toLocaleString()} {unitLabel}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="quantityNeeded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("quantityNeeded")} ({unitLabel})
                    {qtyAutoCalculated && (
                      <span className="ms-1 text-xs text-muted-foreground">({t("wizard.autoCalculated")})</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number" onWheel={(e) => e.currentTarget.blur()} min="0" step="0.001"
                      readOnly={qtyAutoCalculated}
                      className={cn(qtyAutoCalculated && "bg-muted text-muted-foreground")}
                      {...field}
                    />
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
