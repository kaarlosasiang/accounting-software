import { Document, Types } from "mongoose";

/**
 * Transaction Type
 */
export enum InventoryTransactionType {
  PURCHASE = "Purchase",
  SALE = "Sale",
  ADJUSTMENT = "Adjustment",
  TRANSFER = "Transfer",
}

/**
 * Reference Type
 */
export enum InventoryReferenceType {
  INVOICE = "Invoice",
  BILL = "Bill",
  MANUAL = "Manual",
}

/**
 * Inventory Transaction Document Interface
 */
export interface IInventoryTransaction {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  inventoryItemId: Types.ObjectId;
  transactionType: InventoryTransactionType;
  transactionDate: Date;
  referenceType: InventoryReferenceType;
  referenceId: Types.ObjectId; // ID of invoice, bill, etc.
  quantityIn: number; // For purchases and adjustments in
  quantityOut: number; // For sales and adjustments out
  unitCost: number;
  totalValue: number;
  balanceAfter: number; // Quantity on hand after transaction
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

/**
 * Inventory Transaction Document (Mongoose)
 */
export interface IInventoryTransactionDocument
  extends Omit<IInventoryTransaction, "_id">,
    Document {}
