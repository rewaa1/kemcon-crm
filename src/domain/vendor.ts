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

export type VendorContact = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  vendorId: string;
};

export type VendorWithContacts = Vendor & {
  contacts: VendorContact[];
  _count: {
    purchaseOrders: number;
    fabricVendors: number;
  };
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

export type CreateVendorContactInput = {
  nameEn: string;
  nameAr?: string;
  role?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
};

export type UpdateVendorContactInput = Partial<CreateVendorContactInput>;

export interface IVendorRepository {
  findAll(): Promise<VendorSummary[]>;
  findById(id: string): Promise<VendorWithContacts | null>;
  create(data: CreateVendorInput): Promise<Vendor>;
  update(id: string, data: UpdateVendorInput): Promise<Vendor>;
  delete(id: string): Promise<void>;
  addContact(vendorId: string, data: CreateVendorContactInput): Promise<VendorContact>;
  updateContact(vendorId: string, contactId: string, data: UpdateVendorContactInput): Promise<VendorContact>;
  deleteContact(vendorId: string, contactId: string): Promise<void>;
}
