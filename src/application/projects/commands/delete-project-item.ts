import type { IProjectRepository } from "@/domain/project";

export async function deleteProjectItem(
  repo: IProjectRepository,
  itemId: string
): Promise<void> {
  return repo.deleteItem(itemId);
}
