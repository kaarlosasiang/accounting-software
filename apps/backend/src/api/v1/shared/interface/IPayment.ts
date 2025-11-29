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
  invoiceIds: Types.ObjectId[]; // Array of invoices being paid
  supplierId?: Types.ObjectId; // Reference to Supplier (if made)
  billIds: Types.ObjectId[]; // Array of bills being paid
  bankAccountId: Types.ObjectId; // Reference to Account (asset account)
  notes?: string;
  journalEntryId: Types.ObjectId; // Reference to auto-generated JournalEntry
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Document (Mongoose)
 */
export interface IPaymentDocument extends Omit<IPayment, "_id">, Document {}
