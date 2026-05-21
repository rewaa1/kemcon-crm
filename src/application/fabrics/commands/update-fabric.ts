import type { IFabricRepository, Fabric, UpdateFabricInput } from "@/domain/fabric";
import { fabricSchema } from "../schemas";

export async function updateFabric(repo: IFabricRepository, id: string, input: UpdateFabricInput): Promise<Fabric> {
  const data = fabricSchema.partial().parse(input);
  return repo.update(id, data);
}
