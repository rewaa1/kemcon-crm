import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { getHotelById } from "@/application/hotels/queries/get-hotel-by-id";
import { HotelNotFoundError } from "@/domain/errors";
import { HotelDetailHeader } from "@/components/hotels/hotel-detail-header";
import { ContactsTab } from "@/components/hotels/contacts-tab";
import { LocationsTab } from "@/components/hotels/locations-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const repo = new HotelRepository();

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  let hotel;
  try {
    hotel = await getHotelById(repo, id);
  } catch (e) {
    if (e instanceof HotelNotFoundError) notFound();
    throw e;
  }

  const t = await getTranslations("hotels");

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ms-2 mb-2">
          <Link href={`/${locale}/hotels`}>
            <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
            {t("backToList")}
          </Link>
        </Button>
        <HotelDetailHeader hotel={hotel} />
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">
            {t("contacts")} ({hotel.contacts.length})
          </TabsTrigger>
          <TabsTrigger value="locations">
            {t("locations")} ({hotel.locations.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="mt-4">
          <ContactsTab hotelId={hotel.id} contacts={hotel.contacts} />
        </TabsContent>
        <TabsContent value="locations" className="mt-4">
          <LocationsTab hotelId={hotel.id} locations={hotel.locations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
