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
import {
  ITEM_CATEGORIES,
  CATEGORY_FIELDS,
  TRACK_CONTROLS,
  BED_TYPES,
  bedDimensions,
  computeItemQuantity,
  buildItemTypeLabels,
  type ItemCategory,
} from "@/lib/item-fabric-calc";
import type { ProjectItem } from "@/domain/project";
import type { HotelLocation } from "@/domain/hotel";

const schema = z.object({
  itemCategory: z.enum(ITEM_CATEGORIES),
  itemTypeEn: z.string().optional(),
  itemTypeAr: z.string().optional(),
  typeDetail: z.string().optional(),
  locationId: z.string().optional(),
  locationNoteEn: z.string().optional(),
  quantityNeeded: z.coerce.number().positive("Must be greater than 0"),
  notes: z.string().optional(),
  itemCount: z.coerce.number().int().positive().optional(),
  itemWidth: z.coerce.number().positive().optional(),
  itemHeight: z.coerce.number().positive().optional(),
  itemDepth: z.coerce.number().positive().optional(),
  metersPerUnit: z.coerce.number().positive().optional(),
  bedType: z.string().optional(),
  trackControl: z.enum(["MANUAL", "REMOTE"]).optional(),
  totalSupplied: z.coerce.number().positive().optional(),
  productionLoss: z.coerce.number().nonnegative().optional(),
}).refine(
  (d) => d.itemCategory !== "OTHER" || (d.itemTypeEn != null && d.itemTypeEn.trim().length > 0),
  { message: "Item type is required", path: ["itemTypeEn"] }
);

type FormValues = z.output<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  item: ProjectItem;
  locations: HotelLocation[];
};

/** Splits a stored label like "Bed Covers — King" back into its detail part. */
function parseDetail(label: string): string {
  const idx = label.indexOf(" — ");
  return idx >= 0 ? label.slice(idx + 3) : "";
}

export function EditProjectItemDialog({ open, onOpenChange, projectId, item, locations }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const fabricName = item.fabric?.nameEn ?? item.customFabricName ?? "—";
  const unitLabel = item.unit === "METERS" ? t("unitMeters") : t("unitRolls");
  const isNonInventory = item.source === "CLIENT" || item.source === "DIRECT";

  const initialCategory = (item.itemCategory as ItemCategory) ?? "OTHER";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      itemCategory: initialCategory,
      itemTypeEn: initialCategory === "OTHER" ? item.itemTypeEn : "",
      itemTypeAr: initialCategory === "OTHER" ? (item.itemTypeAr ?? "") : "",
      typeDetail: initialCategory === "OTHER" ? "" : parseDetail(item.itemTypeEn),
      locationId: item.locationId ?? "",
      locationNoteEn: item.locationNoteEn ?? "",
      quantityNeeded: item.quantityNeeded,
      notes: item.notes ?? "",
      itemCount: item.itemCount ?? undefined,
      itemWidth: item.itemWidth ?? undefined,
      itemHeight: item.itemHeight ?? undefined,
      itemDepth: item.itemDepth ?? undefined,
      metersPerUnit: item.metersPerUnit ?? undefined,
      bedType: item.bedType ?? "",
      trackControl: (item.trackControl as "MANUAL" | "REMOTE") ?? "MANUAL",
      totalSupplied: item.totalSupplied ?? undefined,
      productionLoss: item.productionLoss ?? undefined,
    },
  });

  const watchedCategory = (useWatch({ control: form.control, name: "itemCategory" }) ?? initialCategory) as ItemCategory;
  const watchedItemCount = useWatch({ control: form.control, name: "itemCount" });
  const watchedWidth = useWatch({ control: form.control, name: "itemWidth" });
  const watchedHeight = useWatch({ control: form.control, name: "itemHeight" });
  const watchedMetersPerUnit = useWatch({ control: form.control, name: "metersPerUnit" });
  const watchedTotalSupplied = useWatch({ control: form.control, name: "totalSupplied" });
  const watchedProductionLoss = useWatch({ control: form.control, name: "productionLoss" });

  const categoryFields = CATEGORY_FIELDS[watchedCategory];

  const calculatedQty = useMemo(
    () =>
      computeItemQuantity(watchedCategory, {
        count: watchedItemCount,
        width: watchedWidth,
        height: watchedHeight,
        metersPerUnit: watchedMetersPerUnit,
      }),
    [watchedCategory, watchedItemCount, watchedWidth, watchedHeight, watchedMetersPerUnit],
  );

  // Leftovers = Total Supplied − Fabric Needed − Production Loss
  const calculatedLeftover = useMemo(() => {
    const supplied = Number(watchedTotalSupplied) || 0;
    const loss = Number(watchedProductionLoss) || 0;
    if (calculatedQty !== null && supplied > 0) {
      return parseFloat((supplied - calculatedQty - loss).toFixed(3));
    }
    return null;
  }, [calculatedQty, watchedTotalSupplied, watchedProductionLoss]);

  // Auto-fill quantityNeeded from the category formula (stays editable)
  useEffect(() => {
    if (calculatedQty !== null) {
      form.setValue("quantityNeeded", calculatedQty);
    }
  }, [calculatedQty]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const category = values.itemCategory;
      const bedLabel = BED_TYPES.find((b) => b.key === values.bedType)?.labelEn;
      const labels = buildItemTypeLabels(category, {
        detail: category === "BED_COVERS" ? bedLabel : values.typeDetail,
        customEn: values.itemTypeEn,
        customAr: values.itemTypeAr,
      });

      const result = await updateProjectItemAction(projectId, item.id, {
        itemCategory: category,
        itemTypeEn: labels.itemTypeEn,
        itemTypeAr: labels.itemTypeAr,
        locationId: values.locationId || undefined,
        locationNoteEn: values.locationNoteEn,
        quantityNeeded: values.quantityNeeded,
        notes: values.notes,
        itemCount: values.itemCount,
        itemWidth: values.itemWidth,
        itemHeight: values.itemHeight,
        itemDepth: values.itemDepth,
        metersPerUnit: values.metersPerUnit,
        bedType: category === "BED_COVERS" ? (values.bedType || undefined) : undefined,
        trackControl: category === "CURTAINS" ? values.trackControl : undefined,
        ...(isNonInventory && {
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
            {/* Item category */}
            <FormField
              control={form.control}
              name="itemCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("itemType")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectCategory")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ITEM_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{t(`category.${c}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type detail — bed covers / chairs / sofas */}
            {categoryFields.typeDetail && (
              <FormField
                control={form.control}
                name="typeDetail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("typeDetail")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("typeDetailPlaceholder")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Custom label — OTHER */}
            {categoryFields.customLabel && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemTypeEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("itemTypeEn")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("itemTypePlaceholder")} {...field} value={field.value ?? ""} />
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
            )}

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

            {/* Category-driven fabric calculation — all sources */}
            {watchedCategory !== "OTHER" && (
              <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("wizard.dimensionsLabel")}
                  </p>
                </div>

                {/* Bed type — fills width & height from the mattress size */}
                {categoryFields.bedType && (
                  <FormField
                    control={form.control}
                    name="bedType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("wizard.bedType")}</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={(v) => {
                            field.onChange(v);
                            const dims = bedDimensions(v);
                            if (dims) {
                              form.setValue("itemWidth", dims.width);
                              form.setValue("itemHeight", dims.height);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("wizard.selectBedType")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BED_TYPES.map((b) => (
                              <SelectItem key={b.key} value={b.key}>
                                {b.labelEn} ({b.widthIn}″ × {b.lengthIn}″)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {categoryFields.dimensions && (
                  <div className={cn("grid gap-3", categoryFields.depth ? "grid-cols-3" : "grid-cols-2")}>
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
                    {categoryFields.depth && (
                      <FormField
                        control={form.control}
                        name="itemDepth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("wizard.itemDepth")} (m)</FormLabel>
                            <FormControl>
                              <Input type="number" onWheel={(e) => e.currentTarget.blur()} min="0" step="0.001" placeholder="0.00" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {categoryFields.metersPerUnit && (
                  <FormField
                    control={form.control}
                    name="metersPerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchedCategory === "PILLOWS" ? t("wizard.metersPerPillow") : t("wizard.metersPerUnit")} ({unitLabel})
                        </FormLabel>
                        <FormControl>
                          <Input type="number" onWheel={(e) => e.currentTarget.blur()} min="0" step="0.001" placeholder="0.000" className="max-w-48" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Curtain track control — one track per curtain */}
                {categoryFields.trackControl && (
                  <FormField
                    control={form.control}
                    name="trackControl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("wizard.trackControl")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="max-w-48">
                              <SelectValue placeholder={t("wizard.selectTrackControl")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRACK_CONTROLS.map((c) => (
                              <SelectItem key={c} value={c}>{t(`wizard.track.${c}`)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {calculatedQty !== null && (
                  <div className="rounded-lg bg-muted/50 border px-3 py-2.5 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t("wizard.fabricNeeded")}</span>
                    <span className="font-semibold tabular-nums">
                      {calculatedQty.toLocaleString()} {unitLabel}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Supplied-fabric reconciliation — CLIENT / DIRECT only */}
            {isNonInventory && (
              <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("wizard.reconciliationLabel")}
                </p>
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
                {calculatedLeftover !== null && (
                  <div className="rounded-lg bg-muted/50 border px-3 py-2.5 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t("wizard.fabricLeftover")}</span>
                    <span className={cn("font-semibold tabular-nums", calculatedLeftover < 0 ? "text-destructive" : "text-green-600")}>
                      {calculatedLeftover.toLocaleString()} {unitLabel}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Quantity — auto-filled from the formula, always editable */}
            <FormField
              control={form.control}
              name="quantityNeeded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("quantityNeeded")} ({unitLabel})
                    {calculatedQty !== null && (
                      <span className="ms-1 text-xs text-muted-foreground">({t("wizard.autoCalculated")})</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number" onWheel={(e) => e.currentTarget.blur()} min="0" step="0.001"
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
