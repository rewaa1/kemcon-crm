import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { FabricRepository } from "@/infrastructure/repositories/fabric.repository";
import { getProjectById } from "@/application/projects/queries/get-project-by-id";
import { getHotelById } from "@/application/hotels/queries/get-hotel-by-id";
import { getFabrics } from "@/application/fabrics/queries/get-fabrics";
import { getHotels } from "@/application/hotels/queries/get-hotels";
import { ProjectNotFoundError } from "@/domain/errors";
import { ProjectDetailHeader } from "@/components/projects/project-detail-header";
import { ProjectItemsTab } from "@/components/projects/project-items-tab";

const repo = new ProjectRepository();
const hotelRepo = new HotelRepository();
const fabricRepo = new FabricRepository();

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  let project;
  try {
    project = await getProjectById(repo, id);
  } catch (e) {
    if (e instanceof ProjectNotFoundError) notFound();
    throw e;
  }

  const [hotel, fabrics, hotels, t] = await Promise.all([
    getHotelById(hotelRepo, project.hotelId),
    getFabrics(fabricRepo),
    getHotels(hotelRepo),
    getTranslations("projects"),
  ]);

  const locations = hotel?.locations ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ms-2 mb-2">
          <Link href={`/${locale}/projects`}>
            <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
            {t("backToList")}
          </Link>
        </Button>
        <ProjectDetailHeader project={project} hotels={hotels} locale={locale} />
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">
            {t("items")} ({project.items.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-4">
          <ProjectItemsTab
            projectId={project.id}
            items={project.items}
            fabrics={fabrics}
            locations={locations}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
