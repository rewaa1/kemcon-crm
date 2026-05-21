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
import { Button } from "@/components/ui/button";
import { projectSchema, type ProjectFormValues } from "@/application/projects/schemas";
import { createProjectAction, updateProjectAction } from "@/app/[locale]/(dashboard)/projects/actions";
import type { HotelSummary } from "@/domain/hotel";
import type { ProjectSummary } from "@/domain/project";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectSummary;
  hotels: HotelSummary[];
};

export function ProjectFormDialog({ open, onOpenChange, project, hotels }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!project;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      nameEn: project?.nameEn ?? "",
      nameAr: project?.nameAr ?? "",
      hotelId: project?.hotel.id ?? "",
      startDate: project?.startDate ? format(new Date(project.startDate), "yyyy-MM-dd") : "",
      deliveryDate: project?.deliveryDate ? format(new Date(project.deliveryDate), "yyyy-MM-dd") : "",
      notes: "",
    },
  });

  function onSubmit(values: ProjectFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateProjectAction(project.id, values)
        : await createProjectAction(values);

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
