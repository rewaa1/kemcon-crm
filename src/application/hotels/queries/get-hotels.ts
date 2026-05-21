import type { IHotelRepository, HotelSummary } from "@/domain/hotel";

export async function getHotels(repo: IHotelRepository): Promise<HotelSummary[]> {
  return repo.findAll();
}
