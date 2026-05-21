import { prisma } from "@/lib/prisma";
import type {
  IHotelRepository,
  Hotel,
  HotelSummary,
  HotelLocation,
  HotelContact,
  CreateHotelInput,
  UpdateHotelInput,
  CreateLocationInput,
  CreateContactInput,
  UpdateContactInput,
} from "@/domain/hotel";

export class HotelRepository implements IHotelRepository {
  async findAll(): Promise<HotelSummary[]> {
    return prisma.hotel.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { projects: true, contacts: true, locations: true } },
      },
    }) as Promise<HotelSummary[]>;
  }

  async findById(id: string): Promise<Hotel | null> {
    return prisma.hotel.findUnique({
      where: { id },
      include: {
        locations: { orderBy: { nameEn: "asc" } },
        contacts: { orderBy: [{ isPrimary: "desc" }, { nameEn: "asc" }] },
      },
    });
  }

  async create(data: CreateHotelInput): Promise<Hotel> {
    return prisma.hotel.create({
      data,
      include: { locations: true, contacts: true },
    });
  }

  async update(id: string, data: UpdateHotelInput): Promise<Hotel> {
    return prisma.hotel.update({
      where: { id },
      data,
      include: { locations: true, contacts: true },
    });
  }

  async delete(id: string): Promise<void> {
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });
    if (hotel?._count.projects && hotel._count.projects > 0) {
      throw new Error("Cannot delete a hotel with active projects");
    }
    await prisma.hotel.delete({ where: { id } });
  }

  async addLocation(data: CreateLocationInput): Promise<HotelLocation> {
    return prisma.hotelLocation.create({ data });
  }

  async deleteLocation(id: string): Promise<void> {
    await prisma.hotelLocation.delete({ where: { id } });
  }

  async addContact(data: CreateContactInput): Promise<HotelContact> {
    return prisma.hotelContact.create({ data });
  }

  async updateContact(id: string, data: UpdateContactInput): Promise<HotelContact> {
    return prisma.hotelContact.update({ where: { id }, data });
  }

  async deleteContact(id: string): Promise<void> {
    await prisma.hotelContact.delete({ where: { id } });
  }
}
