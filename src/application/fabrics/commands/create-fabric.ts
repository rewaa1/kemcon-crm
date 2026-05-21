import type { IFabricRepository, Fabric, CreateFabricInput } from "@/domain/fabric";
import { fabricSchema } from "../schemas";

export async function createFabric(repo: IFabricRepository, input: CreateFabricInput): Promise<Fabric> {
  const data = fabricSchema.parse(input);
  return repo.create(data);
}
