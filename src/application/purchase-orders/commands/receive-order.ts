import type { IPurchaseOrderRepository, PurchaseOrder } from "@/domain/purchase-order";

export async function receivePurchaseOrder(
  repo: IPurchaseOrderRepository,
  id: string
): Promise<PurchaseOrder> {
  return repo.receive(id);
}
