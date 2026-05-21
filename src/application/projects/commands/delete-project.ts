import type { IProjectRepository } from "@/domain/project";

export async function deleteProject(
  repo: IProjectRepository,
  id: string
): Promise<void> {
  return repo.delete(id);
}
