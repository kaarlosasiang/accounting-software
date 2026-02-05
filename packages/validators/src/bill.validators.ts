import { z } from "zod";

// Bill line item schema
export const billLineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  amount: z.number().min(0, "Amount must be non-negative"),
  accountId: z.string().min(1, "Account is required"),
  inventoryItemId: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

// Create bill schema
export const createBillSchema = z
  .object({
    supplierId: z.string().min(1, "Supplier is required"),
    billDate: z.coerce.date(),
    dueDate: z.coerce.date(),
    lineItems: z
      .array(billLineItemSchema)
      .min(1, "At least one line item is required"),
    taxRate: z.number().min(0).max(100).optional().default(0),
    notes: z.string().optional(),
    status: z.enum(["Draft", "Sent", "Partial", "Paid", "Overdue", "Void"]).optional().default("Draft"),
    // Allow frontend to provide calculated amounts directly
    subtotal: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
    balanceDue: z.number().min(0).optional(),
    amountPaid: z.number().min(0).optional().default(0),
    discount: z.number().min(0).optional().default(0),
  })
  .refine((data) => data.dueDate >= data.billDate, {
    message: "Due date must be on or after bill date",
    path: ["dueDate"],
  })
  .refine((data) => {
    // If providing subtotal, ensure line items total matches
    if (data.subtotal && data.lineItems.length > 0) {
      const calculatedSubtotal = data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      if (Math.abs(calculatedSubtotal - data.subtotal) > 0.01) {
        return false;
      }
    }
    return true;
  }, {
    message: "Subtotal must match line items total",
    path: ["subtotal"],
  });

// Update bill schema
export const updateBillSchema = z
  .object({
    supplierId: z.string().min(1, "Supplier is required").optional(),
    billDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
    lineItems: z
      .array(billLineItemSchema)
      .min(1, "At least one line item is required")
      .optional(),
    taxRate: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    status: z
      .enum(["Draft", "Sent", "Partial", "Paid", "Overdue", "Void"])
      .optional(),
    // Allow frontend to update calculated amounts
    subtotal: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
    balanceDue: z.number().min(0).optional(),
    amountPaid: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.billDate && data.dueDate) {
        return data.dueDate >= data.billDate;
      }
      return true;
    },
    {
      message: "Due date must be on or after bill date",
      path: ["dueDate"],
    },
  )
  .refine((data) => {
    // If updating subtotal, ensure line items total matches
    if (data.subtotal && data.lineItems && data.lineItems.length > 0) {
      const calculatedSubtotal = data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      if (Math.abs(calculatedSubtotal - data.subtotal) > 0.01) {
        return false;
      }
    }
    return true;
  }, {
    message: "Subtotal must match line items total",
    path: ["subtotal"],
  });

// Record payment schema
export const recordBillPaymentSchema = z.object({
  amount: z.number().min(0.01, "Payment amount must be greater than 0"),
  paymentDate: z.coerce.date(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
});

// Export types
export type BillLineItem = z.infer<typeof billLineItemSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type RecordBillPaymentInput = z.infer<typeof recordBillPaymentSchema>;
