import type { IPurchaseOrderRepository, PurchaseOrder } from "@/domain/purchase-order";
import { PurchaseOrderNotFoundError } from "@/domain/errors";

export async function getPurchaseOrderById(repo: IPurchaseOrderRepository, id: string): Promise<PurchaseOrder> {
  const order = await repo.findById(id);
  if (!order) throw new PurchaseOrderNotFoundError(id);
  return order;
}
