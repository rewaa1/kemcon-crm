import type { IHotelRepository, Hotel, CreateHotelInput } from "@/domain/hotel";
import { hotelSchema } from "../schemas";

export async function createHotel(repo: IHotelRepository, input: CreateHotelInput): Promise<Hotel> {
  const data = hotelSchema.parse(input);
  return repo.create(data);
}
