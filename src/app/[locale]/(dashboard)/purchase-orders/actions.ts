"use server";

import { revalidatePath } from "next/cache";
import { PurchaseOrderRepository } from "@/infrastructure/repositories/purchase-order.repository";
import { createPurchaseOrder } from "@/application/purchase-orders/commands/create-purchase-order";
import { deletePurchaseOrder } from "@/application/purchase-orders/commands/delete-purchase-order";
import { receivePurchaseOrder } from "@/application/purchase-orders/commands/receive-order";
import type { CreatePurchaseOrderInput } from "@/domain/purchase-order";
import { requireUser } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const repo = new PurchaseOrderRepository();

function revalidate() {
  revalidatePath("/en/purchase-orders");
  revalidatePath("/ar/purchase-orders");
}

export async function createPurchaseOrderAction(
  input: CreatePurchaseOrderInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const order = await createPurchaseOrder(repo, input);
    revalidate();
    return { success: true, data: { id: order.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create purchase order" };
  }
}

export async function receivePurchaseOrderAction(id: string): Promise<ActionResult> {
  try {
    await requireUser();
    await receivePurchaseOrder(repo, id);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to receive purchase order" };
  }
}

export async function deletePurchaseOrderAction(id: string): Promise<ActionResult> {
  try {
    await requireUser();
    await deletePurchaseOrder(repo, id);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete purchase order" };
  }
}
