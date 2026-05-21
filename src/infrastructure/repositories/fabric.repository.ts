import { prisma } from "@/lib/prisma";
import type {
  IFabricRepository,
  Fabric,
  FabricSummary,
  CreateFabricInput,
  UpdateFabricInput,
} from "@/domain/fabric";

export class FabricRepository implements IFabricRepository {
  async findAll(): Promise<FabricSummary[]> {
    return prisma.fabric.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendors: { select: { vendorId: true } },
        _count: { select: { vendors: true, projectItems: true } },
      },
    }) as Promise<FabricSummary[]>;
  }

  async findById(id: string): Promise<Fabric | null> {
    return prisma.fabric.findUnique({ where: { id } });
  }

  async create(data: CreateFabricInput): Promise<Fabric> {
    const { vendorIds = [], ...fabricData } = data;
    return prisma.fabric.create({
      data: {
        ...fabricData,
        vendors: {
          create: vendorIds.map((vendorId) => ({ vendorId })),
        },
      },
    });
  }

  async update(id: string, data: UpdateFabricInput): Promise<Fabric> {
    const { vendorIds, ...fabricData } = data;
    return prisma.fabric.update({
      where: { id },
      data: {
        ...fabricData,
        ...(vendorIds !== undefined
          ? {
              vendors: {
                deleteMany: {},
                create: vendorIds.map((vendorId) => ({ vendorId })),
              },
            }
          : {}),
      },
    });
  }

  async delete(id: string): Promise<void> {
    const fabric = await prisma.fabric.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchaseOrderLines: true, inventoryBatches: true, projectItems: true },
        },
      },
    });
    if (
      fabric &&
      (fabric._count.purchaseOrderLines > 0 ||
        fabric._count.inventoryBatches > 0 ||
        fabric._count.projectItems > 0)
    ) {
      throw new Error("Cannot delete a fabric that has been used in orders or projects");
    }
    await prisma.fabric.delete({ where: { id } });
  }
}
