import type { IProjectRepository, ProjectItemStage, AddProjectItemStageInput } from "@/domain/project";
import { projectItemStageSchema } from "../schemas";

export async function addItemStage(
  repo: IProjectRepository,
  itemId: string,
  input: AddProjectItemStageInput
): Promise<ProjectItemStage> {
  const data = projectItemStageSchema.parse(input);
  return repo.addItemStage(itemId, data);
}
