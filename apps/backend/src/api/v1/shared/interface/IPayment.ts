import { Document, Types } from "mongoose";

/**
 * Payment Type
 */
export enum PaymentType {
  RECEIVED = "Received",
  MADE = "Made",
}

/**
 * Payment Method
 */
export enum PaymentMethod {
  CASH = "Cash",
  CHECK = "Check",
  BANK_TRANSFER = "Bank Transfer",
  CREDIT_CARD = "Credit Card",
  OTHER = "Other",
}

/**
 * Payment Allocation Item
 * Tracks how much of a payment is allocated to each invoice/bill
 */
export interface IPaymentAllocation {
  documentId: Types.ObjectId; // Invoice or Bill ID
  documentNumber: string; // Invoice or Bill number (denormalized)
  allocatedAmount: number; // Amount allocated to this document
  documentType: "INVOICE" | "BILL"; // Type of document
}

/**
 * Payment Document Interface
 */
export interface IPayment {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  paymentNumber: string; // Auto-generated
  paymentDate: Date;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  referenceNumber: string; // Check number, transaction ID, etc.
  amount: number;
  customerId: Types.ObjectId; // Reference to Customer (if received)
  invoiceIds: Types.ObjectId[]; // Array of invoices being paid (deprecated - use allocations)
  allocations: IPaymentAllocation[]; // NEW: Track allocation to each document
  supplierId?: Types.ObjectId; // Reference to Supplier (if made)
  billIds: Types.ObjectId[]; // Array of bills being paid (deprecated - use allocations)
  bankAccountId: Types.ObjectId; // Reference to Account (asset account)
  notes?: string;
  status: "COMPLETED" | "VOIDED"; // Payment status
  voidedAt?: Date; // When payment was voided
  voidedBy?: Types.ObjectId; // User who voided the payment
  journalEntryId: Types.ObjectId; // Reference to auto-generated JournalEntry
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Document (Mongoose)
 */
export interface IPaymentDocument extends Omit<IPayment, "_id">, Document {}
