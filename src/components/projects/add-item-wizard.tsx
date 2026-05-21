"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Loader2, Warehouse, User, ShoppingCart, Layers, PenLine, Search, ImageIcon, Upload, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
import { projectItemSchema, type ProjectItemFormValues } from "@/application/projects/schemas";
import { addProjectItemAction } from "@/app/[locale]/(dashboard)/projects/[id]/actions";
import type { FabricSummary } from "@/domain/fabric";
import type { FabricStockSummary } from "@/domain/inventory";
import type { HotelLocation } from "@/domain/hotel";
import type { SupplySource } from "@/domain/project";

export type AddedItem = {
  id: string;
  fabricName: string;
  source: SupplySource;
  qty: number;
  unit: string;
};

type PickedFabric = {
  id: string | null;
  nameEn: string;
  codeRef: string;
  unit: "METERS" | "ROLLS";
  imageUrl: string | null;
};

type SubStep = "source" | "fabric" | "details";

const SOURCE_OPTIONS = [
  { value: "INVENTORY", icon: Warehouse, labelKey: "wizard.fromInventory", descKey: "wizard.fromInventoryDesc" },
  { value: "CLIENT", icon: User, labelKey: "wizard.clientSupplied", descKey: "wizard.clientSuppliedDesc" },
  { value: "DIRECT", icon: ShoppingCart, labelKey: "wizard.directPurchase", descKey: "wizard.directPurchaseDesc" },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  fabrics: FabricSummary[];
  stockSummary: FabricStockSummary[];
  locations: HotelLocation[];
  onItemAdded?: (item: AddedItem) => void;
};

export function AddItemWizard({
  open, onOpenChange, projectId, fabrics, stockSummary, locations, onItemAdded,
}: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const [subStep, setSubStep] = useState<SubStep>("source");
  const [selectedSource, setSelectedSource] = useState<SupplySource | null>(null);
  const [pickedFabric, setPickedFabric] = useState<PickedFabric | null>(null);
  const [fabricSearch, setFabricSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<ProjectItemFormValues>({
    resolver: zodResolver(projectItemSchema) as Resolver<ProjectItemFormValues>,
    defaultValues: {
      fabricId: "", customFabricName: "", itemTypeEn: "", itemTypeAr: "",
      locationId: "", locationNoteEn: "", quantityNeeded: 0,
      unit: "METERS", source: "INVENTORY", notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setSubStep("source");
    setSelectedSource(null);
    setPickedFabric(null);
    setFabricSearch("");
    setSelectedImageFile(null);
    setImagePreview(null);
    form.reset();
  }, [open]);

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("wizard.imageTooBig"));
      return;
    }
    setSelectedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setSelectedImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `custom/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("fabric-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) return null;
    const { data } = supabase.storage.from("fabric-images").getPublicUrl(path);
    return data.publicUrl;
  }

  const searchLower = fabricSearch.toLowerCase();
  const inventoryFabrics = stockSummary
    .filter((s) => s.totalQuantityLeft > 0)
    .filter((s) => s.nameEn.toLowerCase().includes(searchLower) || s.codeRef.toLowerCase().includes(searchLower));
  const catalogFabrics = fabrics.filter(
    (f) => f.nameEn.toLowerCase().includes(searchLower) || f.codeRef.toLowerCase().includes(searchLower),
  );

  function handleSourcePick(source: SupplySource) {
    setSelectedSource(source);
    setFabricSearch("");
    setSubStep("fabric");
  }

  function handleFabricPick(fabric: PickedFabric) {
    setPickedFabric(fabric);
    form.setValue("fabricId", fabric.id ?? "");
    form.setValue("customFabricName", "");
    form.setValue("unit", fabric.unit);
    form.setValue("source", selectedSource!);
    setSubStep("details");
  }

  function handleCustomFabricPick() {
    setPickedFabric({ id: null, nameEn: "", codeRef: "", unit: "METERS", imageUrl: null });
    form.setValue("fabricId", "");
    form.setValue("customFabricName", "");
    form.setValue("unit", "METERS");
    form.setValue("source", selectedSource!);
    setSubStep("details");
  }

  function onSubmit(values: ProjectItemFormValues) {
    startTransition(async () => {
      let customFabricImageUrl: string | undefined;
      if (!pickedFabric?.id && selectedSource === "CLIENT" && selectedImageFile) {
        const url = await uploadImage(selectedImageFile);
        if (!url) {
          toast.error(t("wizard.imageUploadFailed"));
          return;
        }
        customFabricImageUrl = url;
      }

      const result = await addProjectItemAction(projectId, { ...values, customFabricImageUrl });
      if (result.success && result.data) {
        const fabricName =
          pickedFabric?.id
            ? pickedFabric.nameEn
            : (values.customFabricName?.trim() || t("wizard.customFabricFallback"));
        toast.success(t("itemAddedSuccess"));
        onItemAdded?.({
          id: result.data.id,
          fabricName,
          source: values.source,
          qty: values.quantityNeeded,
          unit: values.unit,
        });
        onOpenChange(false);
      } else {
        toast.error(!result.success ? result.error : t("itemAddFailed"));
      }
    });
  }

  const isWide = subStep === "fabric" || (subStep === "details" && !pickedFabric?.id);
  const watchedUnit = form.watch("unit");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("transition-all", isWide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle>
            {subStep === "source" && t("wizard.chooseSource")}
            {subStep === "fabric" && (selectedSource === "INVENTORY" ? t("wizard.chooseFromStock") : t("wizard.chooseFabric"))}
            {subStep === "details" && t("wizard.itemDetails")}
          </DialogTitle>
        </DialogHeader>

        {/* Source selection */}
        {subStep === "source" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              {SOURCE_OPTIONS.map(({ value, icon: Icon, labelKey, descKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSourcePick(value)}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 hover:border-primary text-start transition-colors"
                >
                  <div className="rounded-md bg-muted p-2 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t(labelKey)}</p>
                    <p className="text-xs text-muted-foreground">{t(descKey)}</p>
                  </div>
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Fabric selection */}
        {subStep === "fabric" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="ps-9"
                placeholder={t("wizard.searchFabric")}
                value={fabricSearch}
                onChange={(e) => setFabricSearch(e.target.value)}
              />
            </div>

            {selectedSource === "INVENTORY" && (
              inventoryFabrics.length === 0 ? (
                <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                  {t("wizard.noStock")}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pe-1">
                  {inventoryFabrics.map((sf) => (
                    <FabricCard
                      key={sf.fabricId}
                      imageUrl={sf.imageUrl}
                      nameEn={sf.nameEn}
                      codeRef={sf.codeRef}
                      badge={
                        <span className="text-xs font-medium text-green-600">
                          {sf.totalQuantityLeft} {sf.unit === "ROLLS" ? t("unitRolls") : t("unitMeters")}
                        </span>
                      }
                      onClick={() =>
                        handleFabricPick({
                          id: sf.fabricId,
                          nameEn: sf.nameEn,
                          codeRef: sf.codeRef,
                          unit: sf.unit as "METERS" | "ROLLS",
                          imageUrl: sf.imageUrl,
                        })
                      }
                    />
                  ))}
                </div>
              )
            )}

            {(selectedSource === "CLIENT" || selectedSource === "DIRECT") && (
              <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pe-1">
                {catalogFabrics.map((f) => (
                  <FabricCard
                    key={f.id}
                    imageUrl={f.imageUrl}
                    nameEn={f.nameEn}
                    codeRef={f.codeRef}
                    onClick={() =>
                      handleFabricPick({ id: f.id, nameEn: f.nameEn, codeRef: f.codeRef, unit: f.unit, imageUrl: f.imageUrl })
                    }
                  />
                ))}
                <button
                  type="button"
                  onClick={handleCustomFabricPick}
                  className="flex flex-col items-center justify-center gap-2 p-3 border border-dashed rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors min-h-[96px]"
                >
                  <PenLine className="h-5 w-5" />
                  <span className="text-xs text-center leading-tight">{t("wizard.customFabric")}</span>
                </button>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => { setSubStep("source"); setFabricSearch(""); }}>
                ← {tc("back")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Item details */}
        {subStep === "details" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4 max-h-[62vh] overflow-y-auto pe-0.5 pb-1">

                {/* Fabric section */}
                {pickedFabric?.id ? (
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3.5 py-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 border">
                      {pickedFabric.imageUrl ? (
                        <Image src={pickedFabric.imageUrl} alt={pickedFabric.nameEn} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{pickedFabric.nameEn}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{pickedFabric.codeRef}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("wizard.customFabricLabel")}
                    </p>
                    <div className="grid grid-cols-[1fr_112px] gap-3 items-start">
                      <FormField
                        control={form.control}
                        name="customFabricName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("wizard.customFabricName")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("wizard.customFabricNamePlaceholder")} {...field} value={field.value ?? ""} />
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
                            <FormLabel>{t("wizard.unit")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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

                    {selectedSource === "CLIENT" && (
                      <>
                        {imagePreview ? (
                          <div
                            className="relative rounded-lg overflow-hidden border cursor-pointer group"
                            style={{ aspectRatio: "16/7" }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Image src={imagePreview} alt="" fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="flex items-center gap-1.5 text-white text-sm font-medium">
                                <Upload className="h-4 w-4" />
                                {t("wizard.changeImage")}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                              className="absolute top-2 end-2 rounded-full bg-black/60 hover:bg-destructive text-white p-1.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed rounded-lg py-7 flex flex-col items-center gap-2.5 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors group"
                          >
                            <div className="rounded-full bg-muted p-2.5 group-hover:bg-primary/10 transition-colors">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-semibold">{t("wizard.uploadImage")}</p>
                              <p className="text-xs text-muted-foreground/70 mt-0.5">JPG, PNG, WebP · max 5 MB</p>
                            </div>
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </>
                    )}
                  </div>
                )}

                <div className="border-t" />

                {/* Item details */}
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
                      <FormLabel>
                        {t("quantityNeeded")}{" "}
                        {(pickedFabric?.unit ?? watchedUnit) === "ROLLS" ? `(${t("unitRolls")})` : `(${t("unitMeters")})`}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.001" placeholder="0" {...field} />
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
              </div>

              <DialogFooter className="pt-4 border-t mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setSubStep("fabric"); setPickedFabric(null); setSelectedImageFile(null); setImagePreview(null); }}
                >
                  ← {tc("back")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {t("addItem")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

type FabricCardProps = {
  imageUrl: string | null;
  nameEn: string;
  codeRef: string;
  badge?: React.ReactNode;
  onClick: () => void;
};

function FabricCard({ imageUrl, nameEn, codeRef, badge, onClick }: FabricCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1.5 p-2.5 border rounded-lg hover:bg-muted/50 hover:border-primary text-start transition-colors"
    >
      {imageUrl ? (
        <div className="relative h-16 w-full rounded overflow-hidden bg-muted">
          <Image src={imageUrl} alt={nameEn} fill className="object-cover" />
        </div>
      ) : (
        <div className="h-16 w-full rounded bg-muted flex items-center justify-center">
          <Layers className="h-6 w-6 text-muted-foreground/50" />
        </div>
      )}
      <p className="text-xs font-medium truncate leading-tight">{nameEn}</p>
      <p className="text-xs text-muted-foreground font-mono">{codeRef}</p>
      {badge}
    </button>
  );
}
