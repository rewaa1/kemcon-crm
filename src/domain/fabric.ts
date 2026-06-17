export type FabricUnit = "METERS" | "ROLLS";

export type Fabric = {
  id: string;
  codeRef: string;
  nameEn: string;
  nameAr: string | null;
  description: string | null;
  imageUrl: string | null;
  unit: FabricUnit;
  createdAt: Date;
  updatedAt: Date;
};

export type FabricSummary = {
  id: string;
  codeRef: string;
  nameEn: string;
  nameAr: string | null;
  description: string | null;
  imageUrl: string | null;
  unit: FabricUnit;
  createdAt: Date;
  vendors: Array<{ vendorId: string }>;
  _count: {
    vendors: number;
    projectItems: number;
  };
};

export type CreateFabricInput = {
  codeRef: string;
  nameEn: string;
  nameAr?: string;
  description?: string;
  imageUrl?: string | null;
  unit: FabricUnit;
  vendorIds?: string[];
};

export type UpdateFabricInput = Partial<CreateFabricInput>;

export interface IFabricRepository {
  findAll(): Promise<FabricSummary[]>;
  findById(id: string): Promise<Fabric | null>;
  create(data: CreateFabricInput): Promise<Fabric>;
  update(id: string, data: UpdateFabricInput): Promise<Fabric>;
  delete(id: string): Promise<void>;
}
