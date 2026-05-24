import { prisma } from "@/lib/prisma";
import { ProjectNotFoundError, InsufficientStockError } from "@/domain/errors";
import type {
  IProjectRepository,
  Project,
  ProjectSummary,
  ProjectItem,
  ProjectStatus,
  SupplySource,
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectItemInput,
  UpdateProjectItemInput,
  MaterialUsageRow,
} from "@/domain/project";

const hotelSelect = { select: { id: true, nameEn: true, nameAr: true } };
const fabricSelect = { select: { id: true, codeRef: true, nameEn: true, nameAr: true, unit: true } };
const locationSelect = { select: { id: true, nameEn: true, nameAr: true } };

function mapItem(item: any): ProjectItem {
  return {
    ...item,
    quantityNeeded: Number(item.quantityNeeded),
  };
}

function mapProject(project: any): Project {
  return {
    ...project,
    items: project.items.map(mapItem),
  };
}

const itemInclude = {
  fabric: fabricSelect,
  location: locationSelect,
};

export class ProjectRepository implements IProjectRepository {
  async findAll(): Promise<ProjectSummary[]> {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        hotel: hotelSelect,
        _count: { select: { items: true } },
      },
    }) as Promise<ProjectSummary[]>;
  }

  async findById(id: string): Promise<Project | null> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        hotel: hotelSelect,
        items: {
          include: itemInclude,
          orderBy: { id: "asc" },
        },
      },
    });
    return project ? mapProject(project) : null;
  }

  async create(data: CreateProjectInput): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        nameEn: data.nameEn,
        nameAr: data.nameAr ?? null,
        hotelId: data.hotelId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        notes: data.notes ?? null,
      },
      include: {
        hotel: hotelSelect,
        items: { include: itemInclude },
      },
    });
    return mapProject(project);
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr || null }),
        ...(data.hotelId !== undefined && { hotelId: data.hotelId }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.deliveryDate !== undefined && { deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
      include: {
        hotel: hotelSelect,
        items: { include: itemInclude, orderBy: { id: "asc" } },
      },
    });
    return mapProject(project);
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    const project = await prisma.project.update({
      where: { id },
      data: { status },
      include: {
        hotel: hotelSelect,
        items: { include: itemInclude, orderBy: { id: "asc" } },
      },
    });
    return mapProject(project);
  }

  async addItem(projectId: string, data: AddProjectItemInput): Promise<ProjectItem> {
    return prisma.$transaction(async (tx) => {
      const item = await tx.projectItem.create({
        data: {
          projectId,
          fabricId: data.fabricId || undefined,
          customFabricName: data.customFabricName || undefined,
          customFabricImageUrl: data.customFabricImageUrl || null,
          itemTypeEn: data.itemTypeEn,
          itemTypeAr: data.itemTypeAr ?? null,
          locationId: data.locationId || null,
          locationNoteEn: data.locationNoteEn || null,
          quantityNeeded: data.quantityNeeded,
          unit: data.unit as any,
          source: data.source as any,
          notes: data.notes ?? null,
        },
        include: itemInclude,
      });

      if (data.source === "INVENTORY" && data.fabricId) {
        const batches = await tx.inventoryBatch.findMany({
          where: { fabricId: data.fabricId, quantityLeft: { gt: 0 } },
          orderBy: { receivedAt: "asc" },
          select: { id: true, quantityLeft: true },
        });

        const usageData: Array<{ projectItemId: string; inventoryBatchId: string; quantityUsed: number }> = [];
        const batchUpdates: Array<{ id: string; consume: number }> = [];
        let remaining = data.quantityNeeded;

        for (const batch of batches) {
          if (remaining <= 0) break;
          const available = Number(batch.quantityLeft);
          const consume = Math.min(remaining, available);
          usageData.push({ projectItemId: item.id, inventoryBatchId: batch.id, quantityUsed: consume });
          batchUpdates.push({ id: batch.id, consume });
          remaining = parseFloat((remaining - consume).toFixed(6));
        }

        if (remaining > 0.001) {
          throw new InsufficientStockError(data.fabricId, remaining);
        }

        if (usageData.length > 0) {
          await Promise.all([
            tx.projectItemUsage.createMany({ data: usageData }),
            ...batchUpdates.map((u) =>
              tx.inventoryBatch.update({
                where: { id: u.id },
                data: { quantityLeft: { decrement: u.consume } },
              })
            ),
          ]);
        }
      }

      return mapItem(item);
    });
  }

  async updateItem(itemId: string, data: UpdateProjectItemInput): Promise<ProjectItem> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.projectItem.findUniqueOrThrow({
        where: { id: itemId },
        select: { quantityNeeded: true, source: true, fabricId: true },
      });

      const oldQty = Number(existing.quantityNeeded);
      const newQty = data.quantityNeeded ?? oldQty;
      const delta = parseFloat((newQty - oldQty).toFixed(6));

      if (delta !== 0 && existing.source === "INVENTORY" && existing.fabricId) {
        if (delta > 0) {
          const batches = await tx.inventoryBatch.findMany({
            where: { fabricId: existing.fabricId, quantityLeft: { gt: 0 } },
            orderBy: { receivedAt: "asc" },
            select: { id: true, quantityLeft: true },
          });

          let remaining = delta;
          const usageData: Array<{ projectItemId: string; inventoryBatchId: string; quantityUsed: number }> = [];
          const batchUpdates: Array<{ id: string; consume: number }> = [];

          for (const batch of batches) {
            if (remaining <= 0) break;
            const available = Number(batch.quantityLeft);
            const consume = Math.min(remaining, available);
            usageData.push({ projectItemId: itemId, inventoryBatchId: batch.id, quantityUsed: consume });
            batchUpdates.push({ id: batch.id, consume });
            remaining = parseFloat((remaining - consume).toFixed(6));
          }

          if (remaining > 0.001) throw new InsufficientStockError(existing.fabricId, remaining);

          await Promise.all([
            tx.projectItemUsage.createMany({ data: usageData }),
            ...batchUpdates.map((u) =>
              tx.inventoryBatch.update({
                where: { id: u.id },
                data: { quantityLeft: { decrement: u.consume } },
              })
            ),
          ]);
        } else {
          // delta is negative — restore |delta| back to inventory LIFO
          let toRestore = Math.abs(delta);
          const usages = await tx.projectItemUsage.findMany({
            where: { projectItemId: itemId },
            orderBy: { id: "desc" },
            select: { id: true, inventoryBatchId: true, quantityUsed: true },
          });

          for (const usage of usages) {
            if (toRestore <= 0) break;
            const used = Number(usage.quantityUsed);
            const restore = Math.min(toRestore, used);
            const remaining = parseFloat((used - restore).toFixed(6));
            toRestore = parseFloat((toRestore - restore).toFixed(6));

            if (remaining <= 0.001) {
              await tx.projectItemUsage.delete({ where: { id: usage.id } });
            } else {
              await tx.projectItemUsage.update({
                where: { id: usage.id },
                data: { quantityUsed: remaining },
              });
            }
            await tx.inventoryBatch.update({
              where: { id: usage.inventoryBatchId },
              data: { quantityLeft: { increment: restore } },
            });
          }
        }
      }

      const updated = await tx.projectItem.update({
        where: { id: itemId },
        data: {
          ...(data.itemTypeEn !== undefined && { itemTypeEn: data.itemTypeEn }),
          ...(data.itemTypeAr !== undefined && { itemTypeAr: data.itemTypeAr || null }),
          ...(data.locationId !== undefined && { locationId: data.locationId || null }),
          ...(data.locationNoteEn !== undefined && { locationNoteEn: data.locationNoteEn || null }),
          ...(data.quantityNeeded !== undefined && { quantityNeeded: data.quantityNeeded }),
          ...(data.notes !== undefined && { notes: data.notes || null }),
        },
        include: itemInclude,
      });

      return mapItem(updated);
    });
  }

  async deleteItem(itemId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const usages = await tx.projectItemUsage.findMany({
        where: { projectItemId: itemId },
        select: { inventoryBatchId: true, quantityUsed: true },
      });

      await Promise.all(
        usages.map((usage) =>
          tx.inventoryBatch.update({
            where: { id: usage.inventoryBatchId },
            data: { quantityLeft: { increment: Number(usage.quantityUsed) } },
          })
        )
      );

      await tx.projectItem.delete({ where: { id: itemId } });
    });
  }

  async getMaterialUsageReport(): Promise<MaterialUsageRow[]> {
    const items = await prisma.projectItem.findMany({
      include: {
        project: {
          include: {
            hotel: { select: { id: true, nameEn: true, nameAr: true } },
          },
        },
        fabric: { select: { id: true, codeRef: true, nameEn: true, nameAr: true, unit: true } },
      },
      orderBy: [{ project: { createdAt: "desc" } }, { id: "asc" }],
    });

    return items.map((item) => ({
      projectItemId: item.id,
      projectId: item.project.id,
      projectNameEn: item.project.nameEn,
      projectNameAr: item.project.nameAr,
      projectStatus: item.project.status as ProjectStatus,
      hotelId: item.project.hotel.id,
      hotelNameEn: item.project.hotel.nameEn,
      hotelNameAr: item.project.hotel.nameAr,
      fabricId: item.fabric?.id ?? null,
      fabricCodeRef: item.fabric?.codeRef ?? "—",
      fabricNameEn: item.fabric?.nameEn ?? (item.customFabricName || "Custom"),
      fabricNameAr: item.fabric?.nameAr ?? null,
      fabricUnit: item.fabric?.unit ?? item.unit,
      itemTypeEn: item.itemTypeEn,
      itemTypeAr: item.itemTypeAr,
      quantityNeeded: Number(item.quantityNeeded),
      source: item.source as SupplySource,
      deliveryDate: item.project.deliveryDate,
    }));
  }

  async delete(id: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!project) throw new ProjectNotFoundError(id);
    if (project.status !== "DRAFT") {
      throw new Error("Only DRAFT projects can be deleted");
    }

    await prisma.$transaction(async (tx) => {
      const usages = await tx.projectItemUsage.findMany({
        where: { projectItem: { projectId: id } },
        select: { inventoryBatchId: true, quantityUsed: true },
      });

      await Promise.all(
        usages.map((usage) =>
          tx.inventoryBatch.update({
            where: { id: usage.inventoryBatchId },
            data: { quantityLeft: { increment: Number(usage.quantityUsed) } },
          })
        )
      );

      await tx.project.delete({ where: { id } });
    });
  }
}
