import type { IHotelRepository } from "@/domain/hotel";

export async function deleteContact(repo: IHotelRepository, id: string): Promise<void> {
  return repo.deleteContact(id);
}
