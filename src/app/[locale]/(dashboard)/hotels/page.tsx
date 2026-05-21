import { getTranslations } from "next-intl/server";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { getHotels } from "@/application/hotels/queries/get-hotels";
import { HotelsTable } from "@/components/hotels/hotels-table";
import { PageHeader } from "@/components/ui/page-header";

const repo = new HotelRepository();

export default async function HotelsPage() {
  const [hotels, t] = await Promise.all([getHotels(repo), getTranslations("hotels")]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <HotelsTable hotels={hotels} />
    </div>
  );
}
