import { prisma } from "@/lib/prisma";
import type {
  IVendorRepository,
  Vendor,
  VendorSummary,
  VendorContact,
  VendorWithContacts,
  CreateVendorInput,
  UpdateVendorInput,
  CreateVendorContactInput,
  UpdateVendorContactInput,
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

  async findById(id: string): Promise<VendorWithContacts | null> {
    return prisma.vendor.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: [{ isPrimary: "desc" }, { nameEn: "asc" }] },
        _count: { select: { purchaseOrders: true, fabricVendors: true } },
      },
    }) as Promise<VendorWithContacts | null>;
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

  async addContact(vendorId: string, data: CreateVendorContactInput): Promise<VendorContact> {
    if (data.isPrimary) {
      await prisma.vendorContact.updateMany({
        where: { vendorId },
        data: { isPrimary: false },
      });
    }
    return prisma.vendorContact.create({ data: { ...data, vendorId } });
  }

  async updateContact(
    vendorId: string,
    contactId: string,
    data: UpdateVendorContactInput
  ): Promise<VendorContact> {
    if (data.isPrimary) {
      await prisma.vendorContact.updateMany({
        where: { vendorId, NOT: { id: contactId } },
        data: { isPrimary: false },
      });
    }
    return prisma.vendorContact.update({ where: { id: contactId }, data });
  }

  async deleteContact(vendorId: string, contactId: string): Promise<void> {
    await prisma.vendorContact.delete({ where: { id: contactId, vendorId } });
  }
}
