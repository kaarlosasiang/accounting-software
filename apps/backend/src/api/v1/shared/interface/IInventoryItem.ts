import { Document, Types } from "mongoose";

/**
 * Inventory Item Document Interface
 */
export interface IInventoryItem {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  sku: string; // SKU or product code
  itemName: string;
  description?: string;
  category: "Food" | "Non-Food";
  unit:
    | "pcs"
    | "kg"
    | "sack"
    | "box"
    | "pack"
    | "bottle"
    | "can"
    | "set"
    | "bundle"
    | "liter";
  quantityOnHand: number;
  quantityAsOfDate: Date;
  reorderLevel: number;
  unitCost: number; // Cost of goods
  sellingPrice: number;
  inventoryAccountId: Types.ObjectId; // Reference to Account (Asset)
  cogsAccountId: Types.ObjectId; // Reference to Account (Expense - Cost of Goods Sold)
  incomeAccountId: Types.ObjectId; // Reference to Account (Revenue)
  supplierId?: Types.ObjectId; // Reference to Supplier (optional)
  salesTaxEnabled: boolean;
  salesTaxRate?: number; // Required if salesTaxEnabled is true
  purchaseTaxRate?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Inventory Item Instance Methods
 */
export interface IInventoryItemMethods {
  adjustQuantity(
    adjustment: number,
    reason: string
  ): Promise<IInventoryItemDocument>;
  updateCost(newCost: number): Promise<IInventoryItemDocument>;
  updateSellingPrice(newPrice: number): Promise<IInventoryItemDocument>;
}

/**
 * Inventory Item Static Methods
 */
export interface IInventoryItemModel {
  findActive(companyId: Types.ObjectId): Promise<IInventoryItemDocument[]>;
  findBySku(
    companyId: Types.ObjectId,
    sku: string
  ): Promise<IInventoryItemDocument | null>;
  findByCategory(
    companyId: Types.ObjectId,
    category: string
  ): Promise<IInventoryItemDocument[]>;
  findNeedingReorder(
    companyId: Types.ObjectId
  ): Promise<IInventoryItemDocument[]>;
  searchItems(
    companyId: Types.ObjectId,
    searchTerm: string
  ): Promise<IInventoryItemDocument[]>;
  getTotalInventoryValue(companyId: Types.ObjectId): Promise<number>;
}

/**
 * Inventory Item Document (Mongoose)
 */
export interface IInventoryItemDocument
  extends Omit<IInventoryItem, "_id">,
    IInventoryItemMethods,
    Document {}
