import { prisma } from "@/lib/prisma";
import type { IDashboardRepository, DashboardStats } from "@/domain/dashboard";

export class DashboardRepository implements IDashboardRepository {
  async getStats(): Promise<DashboardStats> {
    const [projectGroups, fabricsWithBatches, recentPOs] = await Promise.all([
      prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.fabric.findMany({
        select: {
          id: true,
          codeRef: true,
          nameEn: true,
          nameAr: true,
          unit: true,
          inventoryBatches: { select: { quantityIn: true, quantityLeft: true } },
        },
      }),
      prisma.purchaseOrder.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          poNumber: true,
          status: true,
          orderedAt: true,
          vendor: { select: { nameEn: true } },
        },
      }),
    ]);

    const projectCounts = { draft: 0, confirmed: 0, inProduction: 0, delivered: 0 };
    for (const g of projectGroups) {
      if (g.status === "DRAFT") projectCounts.draft = g._count._all;
      if (g.status === "CONFIRMED") projectCounts.confirmed = g._count._all;
      if (g.status === "IN_PRODUCTION") projectCounts.inProduction = g._count._all;
      if (g.status === "DELIVERED") projectCounts.delivered = g._count._all;
    }

    const lowStockFabrics = fabricsWithBatches
      .map((f) => {
        const totalQuantityIn = f.inventoryBatches.reduce(
          (s, b) => s + Number(b.quantityIn),
          0
        );
        const totalQuantityLeft = f.inventoryBatches.reduce(
          (s, b) => s + Number(b.quantityLeft),
          0
        );
        return {
          fabricId: f.id,
          codeRef: f.codeRef,
          nameEn: f.nameEn,
          nameAr: f.nameAr,
          unit: f.unit,
          totalQuantityIn,
          totalQuantityLeft,
        };
      })
      .filter(
        (f) => f.totalQuantityIn > 0 && f.totalQuantityLeft <= f.totalQuantityIn * 0.2
      );

    return {
      projectCounts,
      lowStockFabrics,
      recentPOs: recentPOs.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        vendorNameEn: po.vendor.nameEn,
        status: po.status,
        orderedAt: po.orderedAt,
      })),
    };
  }
}
