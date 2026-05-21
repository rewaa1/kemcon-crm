import { z } from "zod";

export const hotelSchema = z.object({
  nameEn: z.string().min(2, "English name must be at least 2 characters"),
  nameAr: z.string().min(2, "Arabic name must be at least 2 characters"),
});

export const locationSchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  address: z.string().optional(),
});

export const contactSchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional(),
  isPrimary: z.boolean(),
});

export type HotelFormValues = z.infer<typeof hotelSchema>;
export type LocationFormValues = z.infer<typeof locationSchema>;
export type ContactFormValues = z.infer<typeof contactSchema>;
