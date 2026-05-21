"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { FolderKanban, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectFormDialog } from "./project-form-dialog";
import { deleteProjectAction } from "@/app/[locale]/(dashboard)/projects/actions";
import type { ProjectSummary, ProjectStatus } from "@/domain/project";
import type { HotelSummary } from "@/domain/hotel";

type Props = { projects: ProjectSummary[]; hotels: HotelSummary[] };

const STATUS_VARIANT: Record<ProjectStatus, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  CONFIRMED: "outline",
  IN_PRODUCTION: "default",
  DELIVERED: "default",
};

export function ProjectsTable({ projects, hotels }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteProjectAction(deleteTarget.id);
      if (result.success) {
        toast.success(t("deletedSuccess"));
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditProject(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 me-2" />
          {t("new")}
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={t("noProjects")}
          description={t("noProjectsDesc")}
          action={
            <Button onClick={() => { setEditProject(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 me-2" />
              {t("new")}
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">{t("nameEn")}</TableHead>
                <TableHead className="min-w-[130px]">{t("hotel")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                <TableHead className="text-center">{t("items")}</TableHead>
                <TableHead className="min-w-[110px]">{t("startDate")}</TableHead>
                <TableHead className="min-w-[110px]">{t("deliveryDate")}</TableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/${locale}/projects/${project.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{project.nameEn}</div>
                    {project.nameAr && (
                      <div className="text-sm text-muted-foreground" dir="rtl">{project.nameAr}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{project.hotel.nameEn}</TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[project.status]}
                      className={project.status === "DELIVERED" ? "bg-green-600 text-white hover:bg-green-700" : ""}
                    >
                      {t(`status.${project.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{project._count.items}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.startDate ? format(new Date(project.startDate), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.deliveryDate ? format(new Date(project.deliveryDate), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/projects/${project.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditProject(project); setFormOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {project.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(project)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditProject(null); }}
        project={editProject ?? undefined}
        hotels={hotels}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
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
    </>
  );
}
