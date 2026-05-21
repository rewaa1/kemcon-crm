import type { IFabricRepository } from "@/domain/fabric";

export async function deleteFabric(repo: IFabricRepository, id: string): Promise<void> {
  return repo.delete(id);
}
