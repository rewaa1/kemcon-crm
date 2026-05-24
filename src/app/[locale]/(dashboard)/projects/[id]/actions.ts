"use server";

import { revalidatePath } from "next/cache";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { updateProjectStatus } from "@/application/projects/commands/update-project-status";
import { addProjectItem } from "@/application/projects/commands/add-project-item";
import { updateProjectItem } from "@/application/projects/commands/update-project-item";
import { deleteProjectItem } from "@/application/projects/commands/delete-project-item";
import type { ProjectStatus, AddProjectItemInput, UpdateProjectItemInput } from "@/domain/project";
import { requireUser } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

const repo = new ProjectRepository();

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
    return { success: false, error: e instanceof Error ? e.message : "Failed to update status" };
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
    return { success: false, error: e instanceof Error ? e.message : "Failed to add item" };
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
    return { success: false, error: e instanceof Error ? e.message : "Failed to update item" };
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
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete item" };
  }
}
