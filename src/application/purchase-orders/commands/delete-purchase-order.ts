import type { IPurchaseOrderRepository } from "@/domain/purchase-order";

export async function deletePurchaseOrder(repo: IPurchaseOrderRepository, id: string): Promise<void> {
  return repo.delete(id);
}
