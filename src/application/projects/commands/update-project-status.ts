import type { IProjectRepository, Project, ProjectStatus } from "@/domain/project";

export async function updateProjectStatus(
  repo: IProjectRepository,
  id: string,
  status: ProjectStatus
): Promise<Project> {
  return repo.updateStatus(id, status);
}
