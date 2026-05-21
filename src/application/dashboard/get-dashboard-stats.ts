import type { IDashboardRepository, DashboardStats } from "@/domain/dashboard";

export async function getDashboardStats(repo: IDashboardRepository): Promise<DashboardStats> {
  return repo.getStats();
}
