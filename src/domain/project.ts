export type ProjectStatus = "DRAFT" | "CONFIRMED" | "IN_PRODUCTION" | "DELIVERED";
export type SupplySource = "INVENTORY" | "CLIENT" | "DIRECT";

export type ProjectItem = {
  id: string;
  projectId: string;
  fabricId: string | null;
  fabric: {
    id: string;
    codeRef: string;
    nameEn: string;
    nameAr: string | null;
    unit: string;
  } | null;
  customFabricName: string | null;
  customFabricImageUrl: string | null;
  itemTypeEn: string;
  itemTypeAr: string | null;
  locationId: string | null;
  location: { id: string; nameEn: string; nameAr: string } | null;
  locationNoteEn: string | null;
  quantityNeeded: number;
  unit: string;
  source: SupplySource;
  notes: string | null;
};

export type Project = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  status: ProjectStatus;
  hotelId: string;
  hotel: { id: string; nameEn: string; nameAr: string };
  startDate: Date | null;
  deliveryDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: ProjectItem[];
};

export type ProjectSummary = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  status: ProjectStatus;
  hotel: { id: string; nameEn: string; nameAr: string };
  startDate: Date | null;
  deliveryDate: Date | null;
  createdAt: Date;
  _count: { items: number };
};

export type CreateProjectInput = {
  nameEn: string;
  nameAr?: string;
  hotelId: string;
  startDate?: string;
  deliveryDate?: string;
  notes?: string;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export type AddProjectItemInput = {
  fabricId?: string | null;
  customFabricName?: string;
  customFabricImageUrl?: string;
  itemTypeEn: string;
  itemTypeAr?: string;
  locationId?: string;
  locationNoteEn?: string;
  quantityNeeded: number;
  unit: string;
  source: SupplySource;
  notes?: string;
};

export type MaterialUsageRow = {
  projectItemId: string;
  projectId: string;
  projectNameEn: string;
  projectNameAr: string | null;
  projectStatus: ProjectStatus;
  hotelId: string;
  hotelNameEn: string;
  hotelNameAr: string;
  fabricId: string | null;
  fabricCodeRef: string;
  fabricNameEn: string;
  fabricNameAr: string | null;
  fabricUnit: string;
  itemTypeEn: string;
  itemTypeAr: string | null;
  quantityNeeded: number;
  source: SupplySource;
  deliveryDate: Date | null;
};

export interface IProjectRepository {
  findAll(): Promise<ProjectSummary[]>;
  findById(id: string): Promise<Project | null>;
  create(data: CreateProjectInput): Promise<Project>;
  update(id: string, data: UpdateProjectInput): Promise<Project>;
  updateStatus(id: string, status: ProjectStatus): Promise<Project>;
  addItem(projectId: string, data: AddProjectItemInput): Promise<ProjectItem>;
  deleteItem(itemId: string): Promise<void>;
  delete(id: string): Promise<void>;
  getMaterialUsageReport(): Promise<MaterialUsageRow[]>;
}
