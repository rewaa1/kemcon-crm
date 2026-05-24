import { getTranslations } from "next-intl/server";
import { FabricRepository } from "@/infrastructure/repositories/fabric.repository";
import { VendorRepository } from "@/infrastructure/repositories/vendor.repository";
import { getFabrics } from "@/application/fabrics/queries/get-fabrics";
import { getVendors } from "@/application/vendors/queries/get-vendors";
import { FabricsTable } from "@/components/fabrics/fabrics-table";
import { PageHeader } from "@/components/ui/page-header";

const fabricRepo = new FabricRepository();
const vendorRepo = new VendorRepository();

export default async function FabricsPage() {
  const [fabrics, vendors, t] = await Promise.all([
    getFabrics(fabricRepo),
    getVendors(vendorRepo),
    getTranslations("fabrics"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <FabricsTable fabrics={fabrics} vendors={vendors} />
    </div>
  );
}
