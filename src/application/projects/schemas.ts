import { z } from "zod";

export const projectSchema = z.object({
  nameEn: z.string().min(2, "English name must be at least 2 characters"),
  nameAr: z.string().optional(),
  hotelId: z.string().min(1, "Hotel is required"),
  startDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateProjectSchema = projectSchema.partial().extend({
  hotelId: z.string().min(1, "Hotel is required").optional(),
});

export const projectStatusSchema = z.object({
  status: z.enum(["DRAFT", "CONFIRMED", "IN_PRODUCTION", "DELIVERED"]),
});

export const projectItemSchema = z.object({
  fabricId: z.string().min(1, "Fabric is required"),
  itemTypeEn: z.string().min(1, "Item type is required"),
  itemTypeAr: z.string().optional(),
  locationId: z.string().optional(),
  locationNoteEn: z.string().optional(),
  quantityNeeded: z.coerce.number().positive("Must be greater than 0"),
  unit: z.enum(["METERS", "ROLLS"]),
  source: z.enum(["INVENTORY", "CLIENT", "DIRECT"]),
  notes: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;
export type ProjectItemFormValues = z.infer<typeof projectItemSchema>;
