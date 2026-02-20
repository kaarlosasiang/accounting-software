import { z } from "zod";

/**
 * Address schema for supplier
 */
const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});

/**
 * Supplier schema
 */
const supplierSchema = z.object({
  supplierCode: z.preprocess(
    (val) => val || undefined,
    z.string().trim().optional(),
  ),
  supplierName: z.string().min(1, "Supplier name is required"),
  displayName: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone is required"),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  address: addressSchema,
  taxId: z.string().min(1, "Tax ID is required"),
  paymentTerms: z.string().min(1, "Payment terms is required"),
  openingBalance: z
    .number({ message: "Opening balance must be a number" })
    .default(0),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

export type Supplier = z.infer<typeof supplierSchema>;

export { supplierSchema };
