import { z } from "zod";

export const poLineSchema = z.object({
  fabricId: z.string().min(1, "Fabric is required"),
  quantity: z.coerce.number().positive("Must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Must be 0 or greater"),
  metersPerRoll: z.coerce.number().positive().optional(),
  currency: z.string().default("EGP"),
});

export const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  expectedAt: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(poLineSchema).min(1, "At least one line item is required"),
});

export type POLineFormValues = z.infer<typeof poLineSchema>;
export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
