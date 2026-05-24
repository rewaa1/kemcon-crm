import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { format } from "date-fns";
import { VendorRepository } from "@/infrastructure/repositories/vendor.repository";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Mail, Phone, MapPin } from "lucide-react";
import { VendorContactsTab } from "@/components/vendors/vendor-contacts-tab";

const repo = new VendorRepository();

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vendor, t, locale] = await Promise.all([
    repo.findById(id),
    getTranslations("vendors"),
    getLocale(),
  ]);

  if (!vendor) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/vendors`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {t("backToList")}
          </Link>
        </Button>
      </div>

      <PageHeader
        title={vendor.nameEn}
        description={vendor.nameAr ?? undefined}
      />

      {/* Overview card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("overview")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t("phone")}</p>
              {vendor.phone ? (
                <a href={`tel:${vendor.phone}`} className="text-sm hover:underline">
                  {vendor.phone}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t("email")}</p>
              {vendor.email ? (
                <a href={`mailto:${vendor.email}`} className="text-sm hover:underline">
                  {vendor.email}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t("address")}</p>
              <span className="text-sm">{vendor.address ?? "—"}</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("fabrics")}</p>
            <Badge variant="secondary">{vendor._count.fabricVendors}</Badge>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("orders")}</p>
            <Badge variant={vendor._count.purchaseOrders > 0 ? "default" : "secondary"}>
              {vendor._count.purchaseOrders}
            </Badge>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{t("created")}</p>
            <span className="text-sm">{format(new Date(vendor.createdAt), "dd MMM yyyy")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">
            {t("contacts")} {vendor.contacts.length > 0 && `(${vendor.contacts.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="mt-4">
          <VendorContactsTab vendorId={vendor.id} contacts={vendor.contacts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
