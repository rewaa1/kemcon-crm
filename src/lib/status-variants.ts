import type { PurchaseOrderStatus } from "@/domain/purchase-order";
import type { ProjectStatus } from "@/domain/project";

export const PO_STATUS_VARIANT: Record<PurchaseOrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  RECEIVED: "default",
  PARTIAL: "outline",
  CANCELLED: "destructive",
};

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  CONFIRMED: "outline",
  IN_PRODUCTION: "default",
  DELIVERED: "default",
};
