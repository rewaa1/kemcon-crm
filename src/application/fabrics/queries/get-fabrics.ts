import type { IFabricRepository, FabricSummary } from "@/domain/fabric";

export async function getFabrics(repo: IFabricRepository): Promise<FabricSummary[]> {
  return repo.findAll();
}
