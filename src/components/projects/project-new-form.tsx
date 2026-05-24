"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { projectSchema, type ProjectFormValues } from "@/application/projects/schemas";
import { createProjectAction, deleteProjectAction } from "@/app/[locale]/(dashboard)/projects/actions";
import { deleteProjectItemAction } from "@/app/[locale]/(dashboard)/projects/[id]/actions";
import { AddItemWizard, type AddedItem } from "./add-item-wizard";
import type { HotelSummaryWithLocations } from "@/domain/hotel";
import type { FabricSummary } from "@/domain/fabric";
import type { FabricStockSummary } from "@/domain/inventory";
import type { SupplySource } from "@/domain/project";

type Props = {
  hotels: HotelSummaryWithLocations[];
  fabrics: FabricSummary[];
  stockSummary: FabricStockSummary[];
};

export function ProjectNewForm({ hotels, fabrics, stockSummary }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [wizardItems, setWizardItems] = useState<AddedItem[]>([]);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { nameEn: "", nameAr: "", hotelId: "", startDate: "", deliveryDate: "", notes: "" },
  });

  const selectedHotelId = form.watch("hotelId");
  const selectedHotel = hotels.find((h) => h.id === selectedHotelId);
  const hotelLocations = selectedHotel?.locations ?? [];

  // Warn browser-level navigation (refresh / close tab) when a project was created
  useEffect(() => {
    if (!projectId) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [projectId]);

  async function ensureProjectCreated(): Promise<string | null> {
    if (projectId) return projectId;
    const valid = await form.trigger();
    if (!valid) return null;
    const values = form.getValues();
    setIsCreating(true);
    try {
      const result = await createProjectAction(values);
      if (result.success && result.data) {
        setProjectId(result.data.id);
        return result.data.id;
      } else {
        toast.error(!result.success ? result.error : t("createdFailed"));
        return null;
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAddItem() {
    const id = await ensureProjectCreated();
    if (id) setAddItemOpen(true);
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

  function handleFinish() {
    if (projectId) {
      router.push(`/${locale}/projects/${projectId}`);
      return;
    }
    startTransition(async () => {
      const id = await ensureProjectCreated();
      if (id) {
        toast.success(t("createdSuccess"));
        router.push(`/${locale}/projects/${id}`);
      }
    });
  }

  function handleCancel() {
    if (projectId) {
      setLeaveDialogOpen(true);
    } else {
      router.push(`/${locale}/projects`);
    }
  }

  function handleDiscardAndLeave() {
    if (!projectId) {
      router.push(`/${locale}/projects`);
      return;
    }
    startTransition(async () => {
      await deleteProjectAction(projectId);
      router.push(`/${locale}/projects`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Project header fields */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">{t("edit")}</h2>
        <Form {...form}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
              control={form.control}
              name="hotelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("hotel")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                control={form.control}
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
                control={form.control}
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
          </div>
        </Form>
      </div>

      {/* Items section */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">{t("items")}</h2>

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
                  aria-label={`Remove ${item.fabricName}`}
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
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleAddItem}
          disabled={isPending || isCreating}
        >
          {isCreating
            ? <Loader2 className="h-4 w-4 animate-spin me-2" />
            : <Plus className="h-4 w-4 me-2" />}
          {wizardItems.length === 0 ? t("wizard.addFirstItem") : t("wizard.addAnotherItem")}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isPending || isCreating}
        >
          {tc("cancel")}
        </Button>
        <Button
          onClick={handleFinish}
          disabled={isPending || isCreating}
        >
          {(isPending || isCreating) && <Loader2 className="h-4 w-4 animate-spin me-2" />}
          {wizardItems.length > 0 ? t("wizard.finish") : t("new")}
        </Button>
      </div>

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

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leaveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("leaveDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("leaveKeep")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardAndLeave}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? tc("loading") : t("leaveDiscard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
