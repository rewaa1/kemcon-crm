import { getTranslations } from "next-intl/server";
import { FabricRepository } from "@/infrastructure/repositories/fabric.repository";
import { VendorRepository } from "@/infrastructure/repositories/vendor.repository";
import { InventoryRepository } from "@/infrastructure/repositories/inventory.repository";
import { getFabrics } from "@/application/fabrics/queries/get-fabrics";
import { getVendors } from "@/application/vendors/queries/get-vendors";
import { getStockSummary } from "@/application/inventory/queries/get-stock-summary";
import { getAllBatches } from "@/application/inventory/queries/get-all-batches";
import { FabricsTable } from "@/components/fabrics/fabrics-table";
import { StockSummaryTable } from "@/components/inventory/stock-summary-table";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InventoryBatchWithPO } from "@/domain/inventory";

const fabricRepo = new FabricRepository();
const vendorRepo = new VendorRepository();
const inventoryRepo = new InventoryRepository();

export default async function InventoryPage() {
  const [fabrics, vendors, summaries, allBatches, t, tf] = await Promise.all([
    getFabrics(fabricRepo),
    getVendors(vendorRepo),
    getStockSummary(inventoryRepo),
    getAllBatches(inventoryRepo),
    getTranslations("inventory"),
    getTranslations("fabrics"),
  ]);

  const batchesByFabric = allBatches.reduce<Record<string, InventoryBatchWithPO[]>>(
    (map, batch) => {
      if (!map[batch.fabricId]) map[batch.fabricId] = [];
      map[batch.fabricId].push(batch);
      return map;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">
            {t("tabStock")}
          </TabsTrigger>
          <TabsTrigger value="fabrics">
            {tf("title")} ({fabrics.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <StockSummaryTable summaries={summaries} batchesByFabric={batchesByFabric} />
        </TabsContent>

        <TabsContent value="fabrics" className="mt-4">
          <FabricsTable fabrics={fabrics} vendors={vendors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
