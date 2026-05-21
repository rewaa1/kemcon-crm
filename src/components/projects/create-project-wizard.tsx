"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { projectSchema, type ProjectFormValues } from "@/application/projects/schemas";
import { createProjectAction } from "@/app/[locale]/(dashboard)/projects/actions";
import { deleteProjectItemAction } from "@/app/[locale]/(dashboard)/projects/[id]/actions";
import { AddItemWizard, type AddedItem } from "./add-item-wizard";
import type { HotelSummaryWithLocations } from "@/domain/hotel";
import type { FabricSummary } from "@/domain/fabric";
import type { FabricStockSummary } from "@/domain/inventory";
import type { SupplySource } from "@/domain/project";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotels: HotelSummaryWithLocations[];
  fabrics: FabricSummary[];
  stockSummary: FabricStockSummary[];
};

export function CreateProjectWizard({ open, onOpenChange, hotels, fabrics, stockSummary }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<"project" | "items">("project");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectNameEn, setProjectNameEn] = useState("");
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [wizardItems, setWizardItems] = useState<AddedItem[]>([]);

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId);
  const hotelLocations = selectedHotel?.locations ?? [];

  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { nameEn: "", nameAr: "", hotelId: "", startDate: "", deliveryDate: "", notes: "" },
  });

  useEffect(() => {
    if (!open) return;
    setStep("project");
    setProjectId(null);
    setProjectNameEn("");
    setSelectedHotelId("");
    setWizardItems([]);
    setAddItemOpen(false);
    projectForm.reset();
  }, [open]);

  function onProjectSubmit(values: ProjectFormValues) {
    startTransition(async () => {
      const result = await createProjectAction(values);
      if (result.success && result.data) {
        setProjectId(result.data.id);
        setProjectNameEn(values.nameEn);
        setSelectedHotelId(values.hotelId);
        setStep("items");
      } else {
        toast.error(!result.success ? result.error : t("createdFailed"));
      }
    });
  }

  function handleItemAdded(item: AddedItem) {
    setWizardItems((prev) => [...prev, item]);
  }

  function handleRemoveItem(itemId: string) {
    if (!projectId) return;
    startTransition(async () => {
      const result = await deleteProjectItemAction(projectId, itemId);
      if (result.success) {
        setWizardItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success(t("itemDeletedSuccess"));
      } else {
        toast.error(!result.success ? result.error : t("itemDeleteFailed"));
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("transition-all", step === "items" ? "sm:max-w-lg" : "sm:max-w-lg")}>
          <DialogHeader>
            <div className="flex gap-1.5 mb-1">
              <div className="h-1 w-10 rounded-full bg-primary" />
              <div className={cn("h-1 w-10 rounded-full", step === "items" ? "bg-primary" : "bg-muted")} />
            </div>
            <DialogTitle>
              {step === "project" ? t("new") : t("wizard.addItemsTitle")}
            </DialogTitle>
            {step === "items" && projectNameEn && (
              <DialogDescription>{projectNameEn}</DialogDescription>
            )}
          </DialogHeader>

          {/* Step 1: Project Details */}
          {step === "project" && (
            <Form {...projectForm}>
              <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={projectForm.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("nameEn")}</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Lobby Renovation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={projectForm.control}
                    name="nameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("nameAr")}</FormLabel>
                        <FormControl>
                          <Input dir="rtl" placeholder="مثال: تجديد اللوبي" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={projectForm.control}
                  name="hotelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("hotel")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectHotel")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hotels.map((h) => (
                            <SelectItem key={h.id} value={h.id}>{h.nameEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={projectForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("startDate")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={projectForm.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("deliveryDate")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={projectForm.control}
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
                    {isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                    {t("wizard.next")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {/* Step 2: Items list */}
          {step === "items" && (
            <div className="space-y-4">
              {wizardItems.length > 0 ? (
                <div className="border rounded-md divide-y">
                  {wizardItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2.5 gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.fabricName}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {item.qty} {item.unit === "METERS" ? t("unitMeters") : t("unitRolls")}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {t(`source.${item.source as SupplySource}`)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                  {t("wizard.noItemsYet")}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAddItemOpen(true)}
                disabled={isPending}
              >
                <Plus className="h-4 w-4 me-2" />
                {wizardItems.length === 0 ? t("wizard.addFirstItem") : t("wizard.addAnotherItem")}
              </Button>

              <DialogFooter>
                <Button onClick={() => onOpenChange(false)} disabled={isPending}>
                  {t("wizard.finish")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {projectId && (
        <AddItemWizard
          open={addItemOpen}
          onOpenChange={setAddItemOpen}
          projectId={projectId}
          fabrics={fabrics}
          stockSummary={stockSummary}
          locations={hotelLocations}
          onItemAdded={handleItemAdded}
        />
      )}
    </>
  );
}
