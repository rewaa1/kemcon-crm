import type { IVendorRepository, Vendor, UpdateVendorInput } from "@/domain/vendor";
import { vendorSchema } from "../schemas";

export async function updateVendor(repo: IVendorRepository, id: string, input: UpdateVendorInput): Promise<Vendor> {
  const data = vendorSchema.partial().parse(input);
  return repo.update(id, data);
}
