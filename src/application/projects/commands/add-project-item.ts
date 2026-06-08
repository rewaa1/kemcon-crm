import type { IProjectRepository, ProjectItem, AddProjectItemInput } from "@/domain/project";
import { projectItemSchema } from "../schemas";

export async function addProjectItem(
  repo: IProjectRepository,
  projectId: string,
  input: AddProjectItemInput
): Promise<ProjectItem> {
  const data = projectItemSchema.parse(input);
  return repo.addItem(projectId, { ...data, itemTypeEn: data.itemTypeEn ?? "" });
}
