import { getTranslations } from "next-intl/server";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { getMaterialUsageReport } from "@/application/projects/queries/get-material-usage-report";
import { getHotels } from "@/application/hotels/queries/get-hotels";
import { MaterialUsageTable } from "@/components/reports/material-usage-table";
import { PageHeader } from "@/components/ui/page-header";

const projectRepo = new ProjectRepository();
const hotelRepo = new HotelRepository();

export default async function ReportsPage() {
  const [rows, hotels, t] = await Promise.all([
    getMaterialUsageReport(projectRepo),
    getHotels(hotelRepo),
    getTranslations("reports"),
  ]);

  const hotelOptions = hotels.map((h) => ({ id: h.id, nameEn: h.nameEn }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <MaterialUsageTable rows={rows} hotels={hotelOptions} />
    </div>
  );
}
