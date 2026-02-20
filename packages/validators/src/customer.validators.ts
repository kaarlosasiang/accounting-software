import { z } from "zod";

/**
 * Address Schema
 */
const addressSchema = z.object({
  street: z.string().min(1, "Street is required").trim(),
  city: z.string().min(1, "City is required").trim(),
  state: z.string().min(1, "State is required").trim(),
  zipCode: z.string().min(1, "Zip code is required").trim(),
  country: z.string().min(1, "Country is required").trim(),
});

/**
 * Customer Schema for creation
 */
export const customerSchema = z.object({
  customerCode: z.preprocess(
    (val) => val || undefined,
    z.string().trim().optional(),
  ),
  customerName: z.string().min(1, "Customer name is required").trim(),
  displayName: z
    .string()
    .trim()
    .optional()
    .transform((val) => val || undefined),
  email: z.string().email("Please enter a valid email").trim().toLowerCase(),
  phone: z.string().min(1, "Phone is required").trim(),
  website: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url("Please enter a valid URL").trim().optional().nullable(),
  ),
  billingAddress: addressSchema,
  shippingAddress: addressSchema.optional().nullable(),
  taxId: z.string().min(1, "Tax ID is required").trim(),
  paymentTerms: z.string().min(1, "Payment terms is required").trim(),
  creditLimit: z.number().min(0, "Credit limit cannot be negative").default(0),
  openingBalance: z.number().default(0),
  notes: z.string().trim().optional().nullable(),
});

/**
 * Customer Update Schema (all fields optional)
 */
export const customerUpdateSchema = customerSchema.partial();

/**
 * Type exports
 */
export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
