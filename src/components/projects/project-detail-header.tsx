"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Pencil, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectFormDialog } from "./project-form-dialog";
import { updateProjectStatusAction, } from "@/app/[locale]/(dashboard)/projects/[id]/actions";
import { deleteProjectAction } from "@/app/[locale]/(dashboard)/projects/actions";
import type { Project, ProjectStatus } from "@/domain/project";
import type { HotelSummary } from "@/domain/hotel";

type Props = { project: Project; hotels: HotelSummary[]; locale: string };

const ALL_STATUSES: ProjectStatus[] = ["DRAFT", "CONFIRMED", "IN_PRODUCTION", "DELIVERED"];
const STATUS_ORDER: Record<ProjectStatus, number> = {
  DRAFT: 0,
  CONFIRMED: 1,
  IN_PRODUCTION: 2,
  DELIVERED: 3,
};

export function ProjectDetailHeader({ project, hotels, locale }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);

  const [optimisticStatus, setOptimisticStatus] = useOptimistic(project.status);

  function handleStatusChange(status: string) {
    const next = status as ProjectStatus;
    const isBackwards = STATUS_ORDER[next] < STATUS_ORDER[optimisticStatus];
    if (isBackwards) {
      setPendingStatus(next);
      return;
    }
    commitStatusChange(next);
  }

  function commitStatusChange(status: ProjectStatus) {
    startTransition(async () => {
      setOptimisticStatus(status);
      const result = await updateProjectStatusAction(project.id, status);
      if (result.success) {
        toast.success(t("statusUpdatedSuccess"));
        router.refresh();
      } else {
        toast.error(result.error);
        setOptimisticStatus(project.status);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      if (result.success) {
        toast.success(t("deletedSuccess"));
        router.push(`/${locale}/projects`);
      } else {
        toast.error(result.error);
        setDeleteOpen(false);
      }
    });
  }

  const projectAsSummary = {
    ...project,
    _count: { items: project.items.length },
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.nameEn}</h1>
          {project.nameAr && (
            <p className="text-muted-foreground mt-0.5" dir="rtl">{project.nameAr}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">{project.hotel.nameEn}</p>
          {(project.startDate || project.deliveryDate) && (
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0" />
              {project.startDate && (
                <span>{t("startDate")}: {format(new Date(project.startDate), "dd MMM yyyy")}</span>
              )}
              {project.deliveryDate && (
                <span>{t("deliveryDate")}: {format(new Date(project.deliveryDate), "dd MMM yyyy")}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={optimisticStatus}
            onValueChange={handleStatusChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" aria-label={`Edit ${project.nameEn}`} onClick={() => setFormOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>

          {optimisticStatus === "DRAFT" && (
            <Button
              variant="outline"
              size="icon"
              aria-label={`Delete ${project.nameEn}`}
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={projectAsSummary}
        hotels={hotels}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")} &ldquo;{project.nameEn}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backwards transition confirmation */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(o) => !o && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("backwardsTransitionTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("backwardsTransitionDesc", {
                from: t(`status.${optimisticStatus}`),
                to: pendingStatus ? t(`status.${pendingStatus}`) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStatus) commitStatusChange(pendingStatus);
                setPendingStatus(null);
              }}
            >
              {t("backwardsTransitionConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
