import type { IProjectRepository, Project, UpdateProjectInput } from "@/domain/project";
import { updateProjectSchema } from "../schemas";

export async function updateProject(
  repo: IProjectRepository,
  id: string,
  input: UpdateProjectInput
): Promise<Project> {
  const data = updateProjectSchema.parse(input);
  return repo.update(id, data);
}
