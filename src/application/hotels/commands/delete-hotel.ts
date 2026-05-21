import type { IHotelRepository } from "@/domain/hotel";

export async function deleteHotel(repo: IHotelRepository, id: string): Promise<void> {
  return repo.delete(id);
}
