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
  JOURNAL_ENTRY = "JournalEntry",
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
 * Inventory Transaction Static Methods
 */
export interface IInventoryTransactionModel {
  findByInventoryItem(
    inventoryItemId: Types.ObjectId
  ): Promise<IInventoryTransactionDocument[]>;
  findByType(
    companyId: Types.ObjectId,
    transactionType: InventoryTransactionType
  ): Promise<IInventoryTransactionDocument[]>;
  findByDateRange(
    companyId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<IInventoryTransactionDocument[]>;
  findByReference(
    referenceType: InventoryReferenceType,
    referenceId: Types.ObjectId
  ): Promise<IInventoryTransactionDocument[]>;
  getMovementSummary(
    inventoryItemId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<any[]>;
  calculateCOGS(
    inventoryItemId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCOGS: number;
    totalQuantitySold: number;
    averageCost: number;
  }>;
}

/**
 * Inventory Transaction Document (Mongoose)
 */
export interface IInventoryTransactionDocument
  extends Omit<IInventoryTransaction, "_id">,
    Document {}
