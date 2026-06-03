import type { IProjectRepository } from "@/domain/project";

export async function deleteItemStage(
  repo: IProjectRepository,
  stageId: string
): Promise<void> {
  return repo.deleteItemStage(stageId);
}
