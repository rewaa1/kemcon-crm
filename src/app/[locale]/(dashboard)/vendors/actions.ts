"use server";

import { revalidatePath } from "next/cache";
import { VendorRepository } from "@/infrastructure/repositories/vendor.repository";
import { createVendor } from "@/application/vendors/commands/create-vendor";
import { updateVendor } from "@/application/vendors/commands/update-vendor";
import { deleteVendor } from "@/application/vendors/commands/delete-vendor";
import type { CreateVendorInput, UpdateVendorInput } from "@/domain/vendor";

type ActionResult = { success: true } | { success: false; error: string };

const repo = new VendorRepository();

function revalidate() {
  revalidatePath("/en/vendors");
  revalidatePath("/ar/vendors");
}

export async function createVendorAction(input: CreateVendorInput): Promise<ActionResult> {
  try {
    await createVendor(repo, input);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create vendor" };
  }
}

export async function updateVendorAction(id: string, input: UpdateVendorInput): Promise<ActionResult> {
  try {
    await updateVendor(repo, id, input);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update vendor" };
  }
}

export async function deleteVendorAction(id: string): Promise<ActionResult> {
  try {
    await deleteVendor(repo, id);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete vendor" };
  }
}
