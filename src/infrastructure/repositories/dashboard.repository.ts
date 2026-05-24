import { prisma } from "@/lib/prisma";
import type { IDashboardRepository, DashboardStats } from "@/domain/dashboard";

export class DashboardRepository implements IDashboardRepository {
  async getStats(): Promise<DashboardStats> {
    const fabricsPromise = prisma.fabric.findMany({
      select: {
        id: true,
        codeRef: true,
        nameEn: true,
        nameAr: true,
        unit: true,
        inventoryBatches: { select: { quantityIn: true, quantityLeft: true } },
      },
    });

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [projectGroups, recentPOs, overdueCount, pendingPOsToday, fabricsWithBatches] =
      await Promise.all([
        prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
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
        prisma.project.count({
          where: {
            status: { in: ["DRAFT", "CONFIRMED", "IN_PRODUCTION"] },
            deliveryDate: { lt: new Date() },
          },
        }),
        prisma.purchaseOrder.count({
          where: {
            status: "PENDING",
            expectedAt: { lte: todayEnd },
          },
        }),
        fabricsPromise,
      ]);

    const projectCounts = { draft: 0, confirmed: 0, inProduction: 0, delivered: 0, overdue: overdueCount };
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
      pendingPOsToday,
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
