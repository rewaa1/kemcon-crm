import { prisma } from "@/lib/prisma";
import type {
  IVendorRepository,
  Vendor,
  VendorSummary,
  CreateVendorInput,
  UpdateVendorInput,
} from "@/domain/vendor";

export class VendorRepository implements IVendorRepository {
  async findAll(): Promise<VendorSummary[]> {
    return prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { purchaseOrders: true, fabricVendors: true } },
      },
    }) as Promise<VendorSummary[]>;
  }

  async findById(id: string): Promise<Vendor | null> {
    return prisma.vendor.findUnique({ where: { id } });
  }

  async create(data: CreateVendorInput): Promise<Vendor> {
    return prisma.vendor.create({ data });
  }

  async update(id: string, data: UpdateVendorInput): Promise<Vendor> {
    return prisma.vendor.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { _count: { select: { purchaseOrders: true } } },
    });
    if (vendor?._count.purchaseOrders && vendor._count.purchaseOrders > 0) {
      throw new Error("Cannot delete a vendor with existing purchase orders");
    }
    await prisma.vendor.delete({ where: { id } });
  }
}
