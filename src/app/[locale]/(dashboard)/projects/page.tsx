import { getTranslations } from "next-intl/server";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { FabricRepository } from "@/infrastructure/repositories/fabric.repository";
import { InventoryRepository } from "@/infrastructure/repositories/inventory.repository";
import { getProjects } from "@/application/projects/queries/get-projects";
import { getFabrics } from "@/application/fabrics/queries/get-fabrics";
import { getStockSummary } from "@/application/inventory/queries/get-stock-summary";
import { ProjectsTable } from "@/components/projects/projects-table";
import { PageHeader } from "@/components/ui/page-header";

const repo = new ProjectRepository();
const hotelRepo = new HotelRepository();
const fabricRepo = new FabricRepository();
const inventoryRepo = new InventoryRepository();

export default async function ProjectsPage() {
  const [projects, hotels, fabrics, stockSummary, t] = await Promise.all([
    getProjects(repo),
    hotelRepo.findAllWithLocations(),
    getFabrics(fabricRepo),
    getStockSummary(inventoryRepo),
    getTranslations("projects"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ProjectsTable
        projects={projects}
        hotels={hotels}
        fabrics={fabrics}
        stockSummary={stockSummary}
      />
    </div>
  );
}
