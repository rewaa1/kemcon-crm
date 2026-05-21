import { prisma } from "@/lib/prisma";
import { PurchaseOrderNotFoundError } from "@/domain/errors";
import type {
  IPurchaseOrderRepository,
  PurchaseOrder,
  PurchaseOrderSummary,
  PurchaseOrderLine,
  CreatePurchaseOrderInput,
} from "@/domain/purchase-order";

const vendorSelect = { select: { id: true, nameEn: true, nameAr: true } };
const fabricSelect = { select: { id: true, codeRef: true, nameEn: true, nameAr: true, unit: true } };

function mapLine(line: any): PurchaseOrderLine {
  return {
    id: line.id,
    purchaseOrderId: line.purchaseOrderId,
    fabricId: line.fabricId,
    fabric: line.fabric,
    quantity: Number(line.quantity),
    metersPerRoll: line.metersPerRoll != null ? Number(line.metersPerRoll) : null,
    unitPrice: Number(line.unitPrice),
    currency: line.currency,
  };
}

function mapOrder(order: any): PurchaseOrder {
  return {
    ...order,
    lines: order.lines.map(mapLine),
  };
}

export class PurchaseOrderRepository implements IPurchaseOrderRepository {
  async findAll(): Promise<PurchaseOrderSummary[]> {
    return prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: vendorSelect,
        _count: { select: { lines: true } },
      },
    });
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: vendorSelect,
        lines: {
          include: { fabric: fabricSelect },
          orderBy: { id: "asc" },
        },
      },
    });
    return order ? mapOrder(order) : null;
  }

  async create(data: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    const order = await prisma.purchaseOrder.create({
      data: {
        poNumber: data.poNumber,
        vendorId: data.vendorId,
        expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
        notes: data.notes,
        lines: {
          create: data.lines.map((line) => ({
            fabricId: line.fabricId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            metersPerRoll: line.metersPerRoll ?? null,
            currency: line.currency ?? "EGP",
          })),
        },
      },
      include: {
        vendor: vendorSelect,
        lines: { include: { fabric: fabricSelect }, orderBy: { id: "asc" } },
      },
    });
    return mapOrder(order);
  }

  async receive(id: string): Promise<PurchaseOrder> {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: {
        status: true,
        lines: {
          select: {
            id: true,
            fabricId: true,
            quantity: true,
            unitPrice: true,
            metersPerRoll: true,
            currency: true,
          },
        },
      },
    });

    if (!existing) throw new PurchaseOrderNotFoundError(id);
    if (existing.status !== "PENDING") {
      throw new Error("Only PENDING purchase orders can be received");
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const line of existing.lines) {
        await tx.inventoryBatch.create({
          data: {
            fabricId: line.fabricId,
            quantityIn: line.quantity,
            quantityLeft: line.quantity,
            unitCost: line.unitPrice,
            currency: line.currency,
            metersPerRoll: line.metersPerRoll ?? null,
            purchaseOrderLineId: line.id,
          },
        });
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: "RECEIVED", receivedAt: new Date() },
        include: {
          vendor: vendorSelect,
          lines: { include: { fabric: fabricSelect }, orderBy: { id: "asc" } },
        },
      });
    });

    return mapOrder(updated);
  }

  async delete(id: string): Promise<void> {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!order) return;
    if (order.status !== "PENDING") {
      throw new Error("Only PENDING purchase orders can be deleted");
    }
    await prisma.purchaseOrder.delete({ where: { id } });
  }
}
