import type { IVendorRepository, Vendor } from "@/domain/vendor";
import { VendorNotFoundError } from "@/domain/errors";

export async function getVendorById(repo: IVendorRepository, id: string): Promise<Vendor> {
  const vendor = await repo.findById(id);
  if (!vendor) throw new VendorNotFoundError(id);
  return vendor;
}
