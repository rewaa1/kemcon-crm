export type InventoryBatch = {
  id: string;
  fabricId: string;
  fabric?: {
    id: string;
    codeRef: string;
    nameEn: string;
    nameAr: string | null;
    unit: string;
  };
  quantityIn: number;
  quantityLeft: number;
  metersPerRoll: number | null;
  unitCost: number | null;
  currency: string;
  receivedAt: Date;
  notes: string | null;
  purchaseOrderLineId: string | null;
};

export type InventoryBatchWithPO = {
  id: string;
  fabricId: string;
  quantityIn: number;
  quantityLeft: number;
  metersPerRoll: number | null;
  unitCost: number | null;
  currency: string;
  receivedAt: Date;
  notes: string | null;
  purchaseOrderLine: {
    purchaseOrder: { id: string; poNumber: string };
  } | null;
};

export type FabricStockSummary = {
  fabricId: string;
  codeRef: string;
  nameEn: string;
  nameAr: string | null;
  unit: string;
  totalQuantityIn: number;
  totalQuantityLeft: number;
  batchCount: number;
};

export interface IInventoryRepository {
  getStockSummary(): Promise<FabricStockSummary[]>;
  getAllBatches(): Promise<InventoryBatchWithPO[]>;
}
