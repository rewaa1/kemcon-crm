import { z } from "zod";

export const fabricSchema = z.object({
  codeRef: z.string().min(1, "Code reference is required"),
  nameEn: z.string().min(2, "English name must be at least 2 characters"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().nullish(),
  unit: z.enum(["METERS", "ROLLS"]),
  vendorIds: z.array(z.string()).optional(),
});

export type FabricFormValues = z.infer<typeof fabricSchema>;
