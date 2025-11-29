import { Document, Types } from "mongoose";

/**
 * Invoice Line Item
 * Represents individual items/services in an invoice
 */
export interface IInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: Types.ObjectId; // Revenue account
  inventoryItemId?: Types.ObjectId; // Optional, if inventory item
  amount: number; // quantity * unitPrice
}

/**
 * Invoice Status
 */
export enum InvoiceStatus {
  DRAFT = "Draft",
  SENT = "Sent",
  PARTIAL = "Partial",
  PAID = "Paid",
  OVERDUE = "Overdue",
  VOID = "Void",
}

/**
 * Invoice Document Interface
 */
export interface IInvoice {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  customerId: Types.ObjectId;
  invoiceNumber: string;
  invoiceDate?: Date;
  dueDate: number;
  status: InvoiceStatus;
  lineItems: IInvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: Date;
  notes?: string;
  terms?: string;
  journalEntryId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Invoice Document (Mongoose)
 */
export interface IInvoiceDocument extends Omit<IInvoice, "_id">, Document {}
