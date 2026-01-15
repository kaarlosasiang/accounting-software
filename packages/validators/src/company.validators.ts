import { z } from "zod";

export const companySchema = z.object({
  userId: z
    .string({ message: "User ID is required" })
    .regex(/^[a-fA-F0-9]{24}$/, "User ID must be a valid ObjectId"),
  companyName: z
    .string({ message: "Company name is required" })
    .min(1, "Company name is required")
    .max(100, "Company name cannot exceed 100 characters"),
  companyId: z
    .string({ message: "Company ID is required" })
    .min(1, "Company ID is required"),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export const companyUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name cannot exceed 100 characters")
    .optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  description: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type Company = z.infer<typeof companySchema>;
export type CompanyUpdate = z.infer<typeof companyUpdateSchema>;
