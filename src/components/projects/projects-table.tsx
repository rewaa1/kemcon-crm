"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { FolderKanban, Plus, Pencil, Trash2, Search, X, AlertTriangle } from "lucide-react";
import { useTableSort } from "@/lib/use-table-sort";
import { SortableHead } from "@/components/ui/sortable-head";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TablePagination } from "@/components/ui/table-pagination";
import { ProjectFormDialog } from "./project-form-dialog";
import { deleteProjectAction } from "@/app/[locale]/(dashboard)/projects/actions";
import type { ProjectSummary, ProjectStatus } from "@/domain/project";
import type { HotelSummary } from "@/domain/hotel";
import { PROJECT_STATUS_VARIANT } from "@/lib/status-variants";

type DeliveryFilter = "all" | "overdue" | "this-week" | "this-month" | "no-date";

type Props = {
  projects: ProjectSummary[];
  hotels: HotelSummary[];
  initialStatus?: ProjectStatus;
  initialDeliveryFilter?: DeliveryFilter;
};

export function ProjectsTable({ projects, hotels, initialStatus, initialDeliveryFilter }: Props) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterHotel, setFilterHotel] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>(initialStatus ?? "all");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>(initialDeliveryFilter ?? "all");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");

  const uniqueHotels = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.hotel.id, p.hotel.nameEn));
    return Array.from(map.entries()).map(([id, nameEn]) => ({ id, nameEn }));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    const monthEnd = new Date(today);
    monthEnd.setDate(today.getDate() + 30);

    return projects.filter((p) => {
      if (q && !p.nameEn.toLowerCase().includes(q) && !(p.nameAr ?? "").toLowerCase().includes(q)) return false;
      if (filterHotel !== "all" && p.hotel.id !== filterHotel) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (deliveryFilter === "overdue") {
        if (!p.deliveryDate || p.status === "DELIVERED") return false;
        if (new Date(p.deliveryDate) >= today) return false;
      } else if (deliveryFilter === "this-week") {
        if (!p.deliveryDate) return false;
        const d = new Date(p.deliveryDate);
        if (d < today || d > weekEnd) return false;
      } else if (deliveryFilter === "this-month") {
        if (!p.deliveryDate) return false;
        const d = new Date(p.deliveryDate);
        if (d < today || d > monthEnd) return false;
      } else if (deliveryFilter === "no-date") {
        if (p.deliveryDate) return false;
      }
      return true;
    });
  }, [projects, search, filterHotel, filterStatus, deliveryFilter]);

  type ProjectSortKey = "nameEn" | "hotel" | "status" | "items" | "startDate" | "deliveryDate";
  const { sorted: sortedProjects, sort, toggle, setSort } = useTableSort<ProjectSummary, ProjectSortKey>(
    filtered,
    (p, key) => {
      if (key === "nameEn") return p.nameEn;
      if (key === "hotel") return p.hotel.nameEn;
      if (key === "status") return p.status;
      if (key === "items") return p._count.items;
      if (key === "startDate") return p.startDate ? new Date(p.startDate) : null;
      if (key === "deliveryDate") return p.deliveryDate ? new Date(p.deliveryDate) : null;
      return null;
    },
    { key: "deliveryDate", dir: "desc" }
  );

  function handleDateSort(v: "newest" | "oldest") {
    setDateSort(v);
    setSort({ key: "deliveryDate", dir: v === "newest" ? "desc" : "asc" });
    setPage(1);
  }

  const hasFilters = search !== "" || filterHotel !== "all" || filterStatus !== "all" || deliveryFilter !== "all";
  const paginated = useMemo(() => sortedProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sortedProjects, page]);

  function clearFilters() {
    setSearch("");
    setFilterHotel("all");
    setFilterStatus("all");
    setDeliveryFilter("all");
    setPage(1);
  }

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
      <div className="space-y-3 mb-4">
        {/* Row 1 — search, categorical filters, action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="ps-9"
              placeholder={tc("search")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={filterHotel} onValueChange={(v) => { setFilterHotel(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filterAllHotels")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterAllHotels")}</SelectItem>
              {uniqueHotels.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.nameEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("filterAllStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterAllStatuses")}</SelectItem>
              {(["DRAFT", "CONFIRMED", "IN_PRODUCTION", "DELIVERED"] as ProjectStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="ms-auto" asChild>
            <Link href={`/${locale}/projects/new`}>
              <Plus className="h-4 w-4 me-2" />
              {t("new")}
            </Link>
          </Button>
        </div>

        {/* Row 2 — delivery filter + sort + clear */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={deliveryFilter} onValueChange={(v) => { setDeliveryFilter(v as DeliveryFilter); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("deliveryFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("deliveryFilterAll")}</SelectItem>
              <SelectItem value="overdue">{t("deliveryFilterOverdue")}</SelectItem>
              <SelectItem value="this-week">{t("deliveryFilterThisWeek")}</SelectItem>
              <SelectItem value="this-month">{t("deliveryFilterThisMonth")}</SelectItem>
              <SelectItem value="no-date">{t("deliveryFilterNoDate")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateSort} onValueChange={(v) => handleDateSort(v as "newest" | "oldest")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{tc("sortNewest")}</SelectItem>
              <SelectItem value="oldest">{tc("sortOldest")}</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 me-1" />
              {tc("clearFilters")}
            </Button>
          )}
          <span className="ms-auto text-sm text-muted-foreground">
            {filtered.length} {tc("of")} {projects.length}
          </span>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={t("noProjects")}
          description={t("noProjectsDesc")}
          action={
            <Button asChild>
              <Link href={`/${locale}/projects/new`}>
                <Plus className="h-4 w-4 me-2" />
                {t("new")}
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={tc("noResults")}
          description={tc("tryDifferentFilter")}
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead sortKey="nameEn" sort={sort} onToggle={toggle} className="min-w-[160px]">{t("nameEn")}</SortableHead>
                <SortableHead sortKey="hotel" sort={sort} onToggle={toggle} className="min-w-[130px]">{t("hotel")}</SortableHead>
                <SortableHead sortKey="status" sort={sort} onToggle={toggle}>{tc("status")}</SortableHead>
                <SortableHead sortKey="items" sort={sort} onToggle={toggle} className="text-center">{t("items")}</SortableHead>
                <SortableHead sortKey="startDate" sort={sort} onToggle={toggle} className="min-w-[110px]">{t("startDate")}</SortableHead>
                <SortableHead sortKey="deliveryDate" sort={sort} onToggle={toggle} className="min-w-[110px]">{t("deliveryDate")}</SortableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((project) => (
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
                      variant={PROJECT_STATUS_VARIANT[project.status]}
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
                  <TableCell className="text-sm">
                    {project.deliveryDate ? (() => {
                      const isOverdue = project.status !== "DELIVERED" && new Date(project.deliveryDate) < new Date();
                      return (
                        <span className={cn("flex items-center gap-1", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                          {isOverdue && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                          {format(new Date(project.deliveryDate), "dd MMM yyyy")}
                        </span>
                      );
                    })() : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${project.nameEn}`}
                        onClick={() => { setEditProject(project); setFormOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {project.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${project.nameEn}`}
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
          <TablePagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
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
            <AlertDialogTitle>{t("delete")} &ldquo;{deleteTarget?.nameEn}&rdquo;?</AlertDialogTitle>
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
