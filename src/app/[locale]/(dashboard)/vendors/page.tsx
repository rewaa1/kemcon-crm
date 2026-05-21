import { getTranslations } from "next-intl/server";
import { VendorRepository } from "@/infrastructure/repositories/vendor.repository";
import { getVendors } from "@/application/vendors/queries/get-vendors";
import { VendorsTable } from "@/components/vendors/vendors-table";
import { PageHeader } from "@/components/ui/page-header";

const repo = new VendorRepository();

export default async function VendorsPage() {
  const [vendors, t] = await Promise.all([getVendors(repo), getTranslations("vendors")]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <VendorsTable vendors={vendors} />
    </div>
  );
}
