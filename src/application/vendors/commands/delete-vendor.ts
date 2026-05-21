import type { IVendorRepository } from "@/domain/vendor";

export async function deleteVendor(repo: IVendorRepository, id: string): Promise<void> {
  return repo.delete(id);
}
