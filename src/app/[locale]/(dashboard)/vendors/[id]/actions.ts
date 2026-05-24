"use server";

import { revalidatePath } from "next/cache";
import { VendorRepository } from "@/infrastructure/repositories/vendor.repository";
import { requireUser } from "@/lib/supabase/server";
import type { CreateVendorContactInput, UpdateVendorContactInput } from "@/domain/vendor";

type ActionResult = { success: true } | { success: false; error: string };

const repo = new VendorRepository();

function revalidate(vendorId: string) {
  revalidatePath(`/en/vendors/${vendorId}`);
  revalidatePath(`/ar/vendors/${vendorId}`);
  revalidatePath("/en/vendors");
  revalidatePath("/ar/vendors");
}

export async function addVendorContactAction(
  vendorId: string,
  input: CreateVendorContactInput
): Promise<ActionResult> {
  try {
    await requireUser();
    await repo.addContact(vendorId, input);
    revalidate(vendorId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add contact" };
  }
}

export async function updateVendorContactAction(
  vendorId: string,
  contactId: string,
  input: UpdateVendorContactInput
): Promise<ActionResult> {
  try {
    await requireUser();
    await repo.updateContact(vendorId, contactId, input);
    revalidate(vendorId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update contact" };
  }
}

export async function deleteVendorContactAction(
  vendorId: string,
  contactId: string
): Promise<ActionResult> {
  try {
    await requireUser();
    await repo.deleteContact(vendorId, contactId);
    revalidate(vendorId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete contact" };
  }
}
