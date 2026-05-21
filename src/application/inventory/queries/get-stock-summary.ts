import type { IInventoryRepository, FabricStockSummary } from "@/domain/inventory";

export async function getStockSummary(
  repo: IInventoryRepository
): Promise<FabricStockSummary[]> {
  return repo.getStockSummary();
}
