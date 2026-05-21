import { getTranslations } from "next-intl/server";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { getProjects } from "@/application/projects/queries/get-projects";
import { getHotels } from "@/application/hotels/queries/get-hotels";
import { ProjectsTable } from "@/components/projects/projects-table";
import { PageHeader } from "@/components/ui/page-header";

const repo = new ProjectRepository();
const hotelRepo = new HotelRepository();

export default async function ProjectsPage() {
  const [projects, hotels, t] = await Promise.all([
    getProjects(repo),
    getHotels(hotelRepo),
    getTranslations("projects"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ProjectsTable projects={projects} hotels={hotels} />
    </div>
  );
}
