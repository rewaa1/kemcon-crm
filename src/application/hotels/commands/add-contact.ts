import type { IHotelRepository, HotelContact, CreateContactInput } from "@/domain/hotel";
import { contactSchema } from "../schemas";

export async function addContact(repo: IHotelRepository, input: CreateContactInput): Promise<HotelContact> {
  const data = contactSchema.parse(input);
  return repo.addContact({ hotelId: input.hotelId, ...data });
}
