"use server";

import { revalidatePath } from "next/cache";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { createHotel } from "@/application/hotels/commands/create-hotel";
import { updateHotel } from "@/application/hotels/commands/update-hotel";
import { deleteHotel } from "@/application/hotels/commands/delete-hotel";
import type { CreateHotelInput, UpdateHotelInput } from "@/domain/hotel";
import { requireUser } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

const repo = new HotelRepository();

function revalidate() {
  revalidatePath("/en/hotels");
  revalidatePath("/ar/hotels");
}

export async function createHotelAction(input: CreateHotelInput): Promise<ActionResult> {
  try {
    await requireUser();
    await createHotel(repo, input);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create hotel" };
  }
}

export async function updateHotelAction(id: string, input: UpdateHotelInput): Promise<ActionResult> {
  try {
    await requireUser();
    await updateHotel(repo, id, input);
    revalidate();
    revalidatePath(`/en/hotels/${id}`);
    revalidatePath(`/ar/hotels/${id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update hotel" };
  }
}

export async function deleteHotelAction(id: string): Promise<ActionResult> {
  try {
    await requireUser();
    await deleteHotel(repo, id);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete hotel" };
  }
}
