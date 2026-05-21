export type PurchaseOrderStatus = "PENDING" | "RECEIVED" | "PARTIAL" | "CANCELLED";

export type PurchaseOrderLine = {
  id: string;
  purchaseOrderId: string;
  fabricId: string;
  fabric: {
    id: string;
    codeRef: string;
    nameEn: string;
    nameAr: string | null;
    unit: string;
  };
  quantity: number;
  metersPerRoll: number | null;
  unitPrice: number;
  currency: string;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  vendorId: string;
  vendor: { id: string; nameEn: string; nameAr: string | null };
  status: PurchaseOrderStatus;
  orderedAt: Date;
  expectedAt: Date | null;
  receivedAt: Date | null;
  notes: string | null;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines: PurchaseOrderLine[];
};

export type PurchaseOrderSummary = {
  id: string;
  poNumber: string;
  vendor: { id: string; nameEn: string; nameAr: string | null };
  status: PurchaseOrderStatus;
  orderedAt: Date;
  expectedAt: Date | null;
  createdAt: Date;
  _count: { lines: number };
};

export type CreatePurchaseOrderLineInput = {
  fabricId: string;
  quantity: number;
  unitPrice: number;
  metersPerRoll?: number;
  currency?: string;
};

export type CreatePurchaseOrderInput = {
  poNumber: string;
  vendorId: string;
  expectedAt?: string;
  notes?: string;
  lines: CreatePurchaseOrderLineInput[];
};

export interface IPurchaseOrderRepository {
  findAll(): Promise<PurchaseOrderSummary[]>;
  findById(id: string): Promise<PurchaseOrder | null>;
  create(data: CreatePurchaseOrderInput): Promise<PurchaseOrder>;
  receive(id: string): Promise<PurchaseOrder>;
  delete(id: string): Promise<void>;
}
