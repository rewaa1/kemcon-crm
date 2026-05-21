import type { IProjectRepository, Project, CreateProjectInput } from "@/domain/project";
import { projectSchema } from "../schemas";

export async function createProject(
  repo: IProjectRepository,
  input: CreateProjectInput
): Promise<Project> {
  const data = projectSchema.parse(input);
  return repo.create(data);
}
