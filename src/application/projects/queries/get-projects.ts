import type { IProjectRepository, ProjectSummary } from "@/domain/project";

export async function getProjects(repo: IProjectRepository): Promise<ProjectSummary[]> {
  return repo.findAll();
}
