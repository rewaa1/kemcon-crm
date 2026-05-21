export type Vendor = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VendorSummary = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: Date;
  _count: {
    purchaseOrders: number;
    fabricVendors: number;
  };
};

export type CreateVendorInput = {
  nameEn: string;
  nameAr?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type UpdateVendorInput = Partial<CreateVendorInput>;

export interface IVendorRepository {
  findAll(): Promise<VendorSummary[]>;
  findById(id: string): Promise<Vendor | null>;
  create(data: CreateVendorInput): Promise<Vendor>;
  update(id: string, data: UpdateVendorInput): Promise<Vendor>;
  delete(id: string): Promise<void>;
}
