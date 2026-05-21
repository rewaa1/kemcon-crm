import type { IVendorRepository, VendorSummary } from "@/domain/vendor";

export async function getVendors(repo: IVendorRepository): Promise<VendorSummary[]> {
  return repo.findAll();
}
