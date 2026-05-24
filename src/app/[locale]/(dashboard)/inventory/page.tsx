import { getTranslations } from "next-intl/server";
import { InventoryRepository } from "@/infrastructure/repositories/inventory.repository";
import { getStockSummary } from "@/application/inventory/queries/get-stock-summary";
import { getAllBatches } from "@/application/inventory/queries/get-all-batches";
import { StockSummaryTable } from "@/components/inventory/stock-summary-table";
import { PageHeader } from "@/components/ui/page-header";
import type { InventoryBatchWithPO } from "@/domain/inventory";

const inventoryRepo = new InventoryRepository();

const VALID_FILTERS = ["all", "ok", "low", "empty", "none"] as const;
type ValidFilter = (typeof VALID_FILTERS)[number];

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [summaries, allBatches, t, sp] = await Promise.all([
    getStockSummary(inventoryRepo),
    getAllBatches(inventoryRepo),
    getTranslations("inventory"),
    searchParams,
  ]);

  const rawFilter = sp.filter;
  const initialFilterStatus: ValidFilter =
    rawFilter && VALID_FILTERS.includes(rawFilter as ValidFilter)
      ? (rawFilter as ValidFilter)
      : "all";

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
      <PageHeader title={t("title")} description={t("stockDescription")} />
      <StockSummaryTable
        summaries={summaries}
        batchesByFabric={batchesByFabric}
        initialFilterStatus={initialFilterStatus}
      />
    </div>
  );
}
