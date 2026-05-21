import type { IHotelRepository, HotelContact, UpdateContactInput } from "@/domain/hotel";
import { contactSchema } from "../schemas";

export async function updateContact(repo: IHotelRepository, id: string, input: UpdateContactInput): Promise<HotelContact> {
  const data = contactSchema.partial().parse(input);
  return repo.updateContact(id, data);
}
