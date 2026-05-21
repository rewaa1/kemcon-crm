import { z } from "zod";

export const vendorSchema = z.object({
  nameEn: z.string().min(2, "English name must be at least 2 characters"),
  nameAr: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional(),
  address: z.string().optional(),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
