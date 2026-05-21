import type { IHotelRepository, Hotel, UpdateHotelInput } from "@/domain/hotel";
import { hotelSchema } from "../schemas";

export async function updateHotel(repo: IHotelRepository, id: string, input: UpdateHotelInput): Promise<Hotel> {
  const data = hotelSchema.partial().parse(input);
  return repo.update(id, data);
}
