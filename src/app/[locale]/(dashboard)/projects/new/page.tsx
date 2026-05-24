import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { FabricRepository } from "@/infrastructure/repositories/fabric.repository";
import { InventoryRepository } from "@/infrastructure/repositories/inventory.repository";
import { getFabrics } from "@/application/fabrics/queries/get-fabrics";
import { getStockSummary } from "@/application/inventory/queries/get-stock-summary";
import { ProjectNewForm } from "@/components/projects/project-new-form";

const hotelRepo = new HotelRepository();
const fabricRepo = new FabricRepository();
const inventoryRepo = new InventoryRepository();

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [hotels, fabrics, stockSummary, t] = await Promise.all([
    hotelRepo.findAllWithLocations(),
    getFabrics(fabricRepo),
    getStockSummary(inventoryRepo),
    getTranslations("projects"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ms-2 mb-2">
          <Link href={`/${locale}/projects`}>
            <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
            {t("backToList")}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      </div>
      <ProjectNewForm hotels={hotels} fabrics={fabrics} stockSummary={stockSummary} />
    </div>
  );
}
