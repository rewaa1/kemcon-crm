import type { IFabricRepository, Fabric } from "@/domain/fabric";
import { FabricNotFoundError } from "@/domain/errors";

export async function getFabricById(repo: IFabricRepository, id: string): Promise<Fabric> {
  const fabric = await repo.findById(id);
  if (!fabric) throw new FabricNotFoundError(id);
  return fabric;
}
