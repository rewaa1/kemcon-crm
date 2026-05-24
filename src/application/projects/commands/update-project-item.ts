import type { IProjectRepository, UpdateProjectItemInput, ProjectItem } from "@/domain/project";

export async function updateProjectItem(
  repo: IProjectRepository,
  itemId: string,
  data: UpdateProjectItemInput
): Promise<ProjectItem> {
  return repo.updateItem(itemId, data);
}
