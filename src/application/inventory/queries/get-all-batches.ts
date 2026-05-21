import type { IInventoryRepository, InventoryBatchWithPO } from "@/domain/inventory";

export async function getAllBatches(
  repo: IInventoryRepository
): Promise<InventoryBatchWithPO[]> {
  return repo.getAllBatches();
}
