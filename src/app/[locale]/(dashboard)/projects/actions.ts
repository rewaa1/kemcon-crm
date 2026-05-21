"use server";

import { revalidatePath } from "next/cache";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";
import { createProject } from "@/application/projects/commands/create-project";
import { updateProject } from "@/application/projects/commands/update-project";
import { deleteProject } from "@/application/projects/commands/delete-project";
import type { CreateProjectInput, UpdateProjectInput } from "@/domain/project";

type ActionResult = { success: true } | { success: false; error: string };

const repo = new ProjectRepository();

function revalidate(id?: string) {
  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  if (id) {
    revalidatePath(`/en/projects/${id}`);
    revalidatePath(`/ar/projects/${id}`);
  }
}

export async function createProjectAction(
  input: CreateProjectInput
): Promise<ActionResult & { data?: { id: string } }> {
  try {
    const project = await createProject(repo, input);
    revalidate();
    return { success: true, data: { id: project.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create project" };
  }
}

export async function updateProjectAction(
  id: string,
  input: UpdateProjectInput
): Promise<ActionResult> {
  try {
    await updateProject(repo, id, input);
    revalidate(id);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update project" };
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  try {
    await deleteProject(repo, id);
    revalidate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete project" };
  }
}
