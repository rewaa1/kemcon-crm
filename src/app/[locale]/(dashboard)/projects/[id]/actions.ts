"use server";

import { revalidatePath } from "next/cache";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { HotelRepository } from "@/infrastructure/repositories/hotel.repository";
import { addLocation } from "@/application/hotels/commands/add-location";
import { updateProjectStatus } from "@/application/projects/commands/update-project-status";
import { addProjectItem } from "@/application/projects/commands/add-project-item";
import { updateProjectItem } from "@/application/projects/commands/update-project-item";
import { deleteProjectItem } from "@/application/projects/commands/delete-project-item";
import { addItemStage } from "@/application/projects/commands/add-item-stage";
import { deleteItemStage } from "@/application/projects/commands/delete-item-stage";
import type { ProjectStatus, AddProjectItemInput, UpdateProjectItemInput, AddProjectItemStageInput } from "@/domain/project";
import { requireUser } from "@/lib/supabase/server";
import { toUserMessage } from "@/lib/action-error";

type ActionResult = { success: true } | { success: false; error: string };

const repo = new ProjectRepository();
const hotelRepo = new HotelRepository();

function revalidate(id: string) {
  revalidatePath(`/en/projects/${id}`);
  revalidatePath(`/ar/projects/${id}`);
  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  revalidatePath("/en/inventory");
  revalidatePath("/ar/inventory");
}

export async function updateProjectStatusAction(
  id: string,
  status: ProjectStatus
): Promise<ActionResult> {
  try {
    await requireUser();
    await updateProjectStatus(repo, id, status);
    revalidate(id);
    return { success: true };
  } catch (e) {
    return { success: false, error: toUserMessage(e, "Failed to update status") };
  }
}

export async function addProjectItemAction(
  projectId: string,
  input: AddProjectItemInput
): Promise<ActionResult & { data?: { id: string } }> {
  try {
    await requireUser();
    const item = await addProjectItem(repo, projectId, input);
    revalidate(projectId);
    return { success: true, data: { id: item.id } };
  } catch (e) {
    return { success: false, error: toUserMessage(e, "Failed to add item") };
  }
}

export async function updateProjectItemAction(
  projectId: string,
  itemId: string,
  input: UpdateProjectItemInput
): Promise<ActionResult> {
  try {
    await requireUser();
    await updateProjectItem(repo, itemId, input);
    revalidate(projectId);
    return { success: true };
  } catch (e) {
    return { success: false, error: toUserMessage(e, "Failed to update item") };
  }
}

export async function addHotelLocationAction(
  hotelId: string,
  input: { nameEn: string; nameAr?: string; address?: string }
): Promise<ActionResult & { data?: { id: string; nameEn: string; nameAr: string } }> {
  try {
    await requireUser();
    const loc = await addLocation(hotelRepo, { hotelId, nameEn: input.nameEn, nameAr: input.nameAr ?? "", address: input.address });
    revalidatePath(`/en/hotels/${hotelId}`);
    revalidatePath(`/ar/hotels/${hotelId}`);
    return { success: true, data: { id: loc.id, nameEn: loc.nameEn, nameAr: loc.nameAr } };
  } catch (e) {
    return { success: false, error: toUserMessage(e, "Failed to add location") };
  }
}

export async function deleteProjectItemAction(
  projectId: string,
  itemId: string
): Promise<ActionResult> {
  try {
    await requireUser();
    await deleteProjectItem(repo, itemId);
    revalidate(projectId);
    return { success: true };
  } catch (e) {
    return { success: false, error: toUserMessage(e, "Failed to delete item") };
  }
}

export async function addProjectItemStageAction(
  projectId: string,
  itemId: string,
  input: AddProjectItemStageInput
): Promise<ActionResult> {
  try {
    await requireUser();
    await addItemStage(repo, itemId, input);
    revalidate(projectId);
    return { success: true };
  } catch (e) {
    return { success: false, error: toUserMessage(e, "Failed to add stage") };
  }
}

export async function deleteProjectItemStageAction(
  projectId: string,
  stageId: string
): Promise<ActionResult> {
  try {
    await requireUser();
    await deleteItemStage(repo, stageId);
    revalidate(projectId);
    return { success: true };
  } catch (e) {
    return { success: false, error: toUserMessage(e, "Failed to delete stage") };
  }
}
