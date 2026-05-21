"use server";

import { revalidatePath } from "next/cache";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { addLocation } from "@/application/hotels/commands/add-location";
import { deleteLocation } from "@/application/hotels/commands/delete-location";
import { addContact } from "@/application/hotels/commands/add-contact";
import { updateContact } from "@/application/hotels/commands/update-contact";
import { deleteContact } from "@/application/hotels/commands/delete-contact";
import type { CreateLocationInput, CreateContactInput, UpdateContactInput } from "@/domain/hotel";

type ActionResult = { success: true } | { success: false; error: string };

const repo = new HotelRepository();

function revalidate(hotelId: string) {
  revalidatePath(`/en/hotels/${hotelId}`);
  revalidatePath(`/ar/hotels/${hotelId}`);
}

export async function addLocationAction(
  hotelId: string,
  input: Omit<CreateLocationInput, "hotelId">
): Promise<ActionResult> {
  try {
    await addLocation(repo, { hotelId, ...input });
    revalidate(hotelId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add location" };
  }
}

export async function deleteLocationAction(hotelId: string, locationId: string): Promise<ActionResult> {
  try {
    await deleteLocation(repo, locationId);
    revalidate(hotelId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete location" };
  }
}

export async function addContactAction(
  hotelId: string,
  input: Omit<CreateContactInput, "hotelId">
): Promise<ActionResult> {
  try {
    await addContact(repo, { hotelId, ...input });
    revalidate(hotelId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add contact" };
  }
}

export async function updateContactAction(
  hotelId: string,
  contactId: string,
  input: UpdateContactInput
): Promise<ActionResult> {
  try {
    await updateContact(repo, contactId, input);
    revalidate(hotelId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update contact" };
  }
}

export async function deleteContactAction(hotelId: string, contactId: string): Promise<ActionResult> {
  try {
    await deleteContact(repo, contactId);
    revalidate(hotelId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete contact" };
  }
}
