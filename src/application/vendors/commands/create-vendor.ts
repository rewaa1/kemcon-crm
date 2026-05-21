import type { IVendorRepository, Vendor, CreateVendorInput } from "@/domain/vendor";
import { vendorSchema } from "../schemas";

export async function createVendor(repo: IVendorRepository, input: CreateVendorInput): Promise<Vendor> {
  const data = vendorSchema.parse(input);
  return repo.create(data);
}
