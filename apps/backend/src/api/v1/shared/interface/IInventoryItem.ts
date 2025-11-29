import { Document, Types } from "mongoose";

/**
 * Inventory Item Document Interface
 */
export interface IInventoryItem {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  itemCode: string; // SKU or product code
  itemName: string;
  description?: string;
  category: string;
  unit: string; // 'pcs', 'kg', 'box'
  quantityOnHand: number;
  reorderLevel: number;
  unitCost: number; // Cost of goods
  sellingPrice: number;
  inventoryAccountId: Types.ObjectId; // Reference to Account (Asset)
  cogsAccountId: Types.ObjectId; // Reference to Account (Expense - Cost of Goods Sold)
  incomeAccountId: Types.ObjectId; // Reference to Account (Revenue)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Inventory Item Document (Mongoose)
 */
export interface IInventoryItemDocument
  extends Omit<IInventoryItem, "_id">,
    Document {}
