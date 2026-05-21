import type { IHotelRepository, HotelLocation, CreateLocationInput } from "@/domain/hotel";
import { locationSchema } from "../schemas";

export async function addLocation(repo: IHotelRepository, input: CreateLocationInput): Promise<HotelLocation> {
  const data = locationSchema.parse(input);
  return repo.addLocation({ hotelId: input.hotelId, ...data });
}
