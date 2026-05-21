import type { IHotelRepository, Hotel } from "@/domain/hotel";
import { HotelNotFoundError } from "@/domain/errors";

export async function getHotelById(repo: IHotelRepository, id: string): Promise<Hotel> {
  const hotel = await repo.findById(id);
  if (!hotel) throw new HotelNotFoundError(id);
  return hotel;
}
