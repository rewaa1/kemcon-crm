export type DashboardStats = {
  projectCounts: {
    draft: number;
    confirmed: number;
    inProduction: number;
    delivered: number;
    overdue: number;
  };
  pendingPOsToday: number;
  lowStockFabrics: {
    fabricId: string;
    codeRef: string;
    nameEn: string;
    nameAr: string | null;
    unit: string;
    totalQuantityIn: number;
    totalQuantityLeft: number;
  }[];
  recentPOs: {
    id: string;
    poNumber: string;
    vendorNameEn: string;
    status: string;
    orderedAt: Date;
  }[];
};

export interface IDashboardRepository {
  getStats(): Promise<DashboardStats>;
}
