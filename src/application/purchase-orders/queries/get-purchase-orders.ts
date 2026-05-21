import type { IPurchaseOrderRepository, PurchaseOrderSummary } from "@/domain/purchase-order";

export async function getPurchaseOrders(repo: IPurchaseOrderRepository): Promise<PurchaseOrderSummary[]> {
  return repo.findAll();
}
