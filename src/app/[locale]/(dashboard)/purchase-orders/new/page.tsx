import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorRepository } from "@/infrastructure/repositories/vendor.repository";
import { FabricRepository } from "@/infrastructure/repositories/fabric.repository";
import { getVendors } from "@/application/vendors/queries/get-vendors";
import { getFabrics } from "@/application/fabrics/queries/get-fabrics";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";

const vendorRepo = new VendorRepository();
const fabricRepo = new FabricRepository();

export default async function NewPurchaseOrderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [vendors, fabrics, t] = await Promise.all([
    getVendors(vendorRepo),
    getFabrics(fabricRepo),
    getTranslations("purchaseOrders"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ms-2 mb-2">
          <Link href={`/${locale}/purchase-orders`}>
            <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
            {t("backToList")}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      </div>
      <PurchaseOrderForm vendors={vendors} fabrics={fabrics} locale={locale} />
    </div>
  );
}
