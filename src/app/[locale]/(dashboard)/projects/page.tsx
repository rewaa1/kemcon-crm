import { getTranslations } from "next-intl/server";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { getProjects } from "@/application/projects/queries/get-projects";
import { getHotels } from "@/application/hotels/queries/get-hotels";
import { ProjectsTable } from "@/components/projects/projects-table";
import { PageHeader } from "@/components/ui/page-header";
import type { ProjectStatus } from "@/domain/project";

const repo = new ProjectRepository();
const hotelRepo = new HotelRepository();

const VALID_STATUSES: ProjectStatus[] = ["DRAFT", "CONFIRMED", "IN_PRODUCTION", "DELIVERED"];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; overdue?: string }>;
}) {
  const [projects, hotels, t, params] = await Promise.all([
    getProjects(repo),
    getHotels(hotelRepo),
    getTranslations("projects"),
    searchParams,
  ]);

  const rawStatus = params.status;
  const initialStatus = rawStatus && VALID_STATUSES.includes(rawStatus as ProjectStatus)
    ? (rawStatus as ProjectStatus)
    : undefined;

  const initialDeliveryFilter = params.overdue === "true" ? "overdue" as const : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ProjectsTable
        projects={projects}
        hotels={hotels}
        initialStatus={initialStatus}
        initialDeliveryFilter={initialDeliveryFilter}
      />
    </div>
  );
}
