import { prisma } from "@/lib/prisma";
import type {
  IInventoryRepository,
  FabricStockSummary,
  InventoryBatchWithPO,
} from "@/domain/inventory";

export class InventoryRepository implements IInventoryRepository {
  async getStockSummary(): Promise<FabricStockSummary[]> {
    const fabrics = await prisma.fabric.findMany({
      orderBy: { nameEn: "asc" },
      include: {
        inventoryBatches: {
          select: { quantityIn: true, quantityLeft: true },
        },
      },
    });

    return fabrics.map((fabric) => {
      const totalQuantityIn = fabric.inventoryBatches.reduce(
        (sum, b) => sum + Number(b.quantityIn),
        0
      );
      const totalQuantityLeft = fabric.inventoryBatches.reduce(
        (sum, b) => sum + Number(b.quantityLeft),
        0
      );
      return {
        fabricId: fabric.id,
        codeRef: fabric.codeRef,
        nameEn: fabric.nameEn,
        nameAr: fabric.nameAr,
        unit: fabric.unit,
        totalQuantityIn,
        totalQuantityLeft,
        batchCount: fabric.inventoryBatches.length,
      };
    });
  }

  async getAllBatches(): Promise<InventoryBatchWithPO[]> {
    const batches = await prisma.inventoryBatch.findMany({
      orderBy: { receivedAt: "desc" },
      include: {
        purchaseOrderLine: {
          select: {
            purchaseOrder: { select: { id: true, poNumber: true } },
          },
        },
      },
    });

    return batches.map((b) => ({
      id: b.id,
      fabricId: b.fabricId,
      quantityIn: Number(b.quantityIn),
      quantityLeft: Number(b.quantityLeft),
      metersPerRoll: b.metersPerRoll != null ? Number(b.metersPerRoll) : null,
      unitCost: b.unitCost != null ? Number(b.unitCost) : null,
      currency: b.currency,
      receivedAt: b.receivedAt,
      notes: b.notes,
      purchaseOrderLine: b.purchaseOrderLine,
    }));
  }
}
