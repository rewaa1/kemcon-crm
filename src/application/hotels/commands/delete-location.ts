import type { IHotelRepository } from "@/domain/hotel";

export async function deleteLocation(repo: IHotelRepository, id: string): Promise<void> {
  return repo.deleteLocation(id);
}
