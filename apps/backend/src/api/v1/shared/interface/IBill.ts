import { Document, Types } from "mongoose";

/**
 * Bill Line Item
 * Represents individual items/services in a bill
 */
export interface IBillLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: Types.ObjectId; // Expense account
  inventoryItemId?: Types.ObjectId; // Optional, if inventory item
  amount: number; // quantity * unitPrice
}

/**
 * Bill Status
 */
export enum BillStatus {
  DRAFT = "Draft",
  OPEN = "Open",
  PARTIAL = "Partial",
  PAID = "Paid",
  OVERDUE = "Overdue",
  VOID = "Void",
}

/**
 * Bill Document Interface
 */
export interface IBill {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  supplierId: Types.ObjectId;
  billNumber: number;
  dueDate: Date;
  status: BillStatus;
  lineItems: IBillLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: Date;
  notes?: string;
  journalEntryId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bill Document (Mongoose)
 */
export interface IBillDocument extends Omit<IBill, "_id">, Document {}
