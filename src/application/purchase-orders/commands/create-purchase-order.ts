import type { IPurchaseOrderRepository, PurchaseOrder, CreatePurchaseOrderInput } from "@/domain/purchase-order";
import { purchaseOrderSchema } from "../schemas";

export async function createPurchaseOrder(
  repo: IPurchaseOrderRepository,
  input: CreatePurchaseOrderInput
): Promise<PurchaseOrder> {
  const data = purchaseOrderSchema.parse(input);
  return repo.create(data);
}
