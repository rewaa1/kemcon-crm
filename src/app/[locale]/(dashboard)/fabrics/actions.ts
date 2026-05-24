"use server";

import { revalidatePath } from "next/cache";
import { FabricRepository } from "@/infrastructure/repositories/fabric.repository";
import { createFabric } from "@/application/fabrics/commands/create-fabric";
import { updateFabric } from "@/application/fabrics/commands/update-fabric";
import { deleteFabric } from "@/application/fabrics/commands/delete-fabric";
import type { CreateFabricInput, UpdateFabricInput } from "@/domain/fabric";
import { requireUser } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

const repo = new FabricRepository();

function revalidate() {
  revalidatePath("/en/fabrics");
  revalidatePath("/ar/fabrics");
  revalidatePath("/en/inventory");
  revalidatePath("/ar/inventory");
}

export async function createFabricAction(input: CreateFabricInput): Promise<ActionResult> {
  try {
    await requireUser();
    await createFabric(repo, input);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create fabric" };
  }
}

export async function updateFabricAction(id: string, input: UpdateFabricInput): Promise<ActionResult> {
  try {
    await requireUser();
    await updateFabric(repo, id, input);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update fabric" };
  }
}

export async function deleteFabricAction(id: string): Promise<ActionResult> {
  try {
    await requireUser();
    await deleteFabric(repo, id);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete fabric" };
  }
}
