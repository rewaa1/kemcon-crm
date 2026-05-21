import type { IProjectRepository, MaterialUsageRow } from "@/domain/project";

export async function getMaterialUsageReport(
  repo: IProjectRepository
): Promise<MaterialUsageRow[]> {
  return repo.getMaterialUsageReport();
}
