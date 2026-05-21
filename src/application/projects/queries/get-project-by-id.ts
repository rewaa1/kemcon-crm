import type { IProjectRepository, Project } from "@/domain/project";
import { ProjectNotFoundError } from "@/domain/errors";

export async function getProjectById(repo: IProjectRepository, id: string): Promise<Project> {
  const project = await repo.findById(id);
  if (!project) throw new ProjectNotFoundError(id);
  return project;
}
