import mongoose, { Schema, Model } from "mongoose";

import {
  IInventoryItem,
  IInventoryItemDocument,
  IInventoryItemModel,
  IInventoryItemMethods,
} from "../shared/interface/IInventoryItem.js";

/**
 * Inventory Item Schema
 */
const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    itemType: {
      type: String,
      required: [true, "Item type is required"],
      enum: ["Product", "Service"],
      default: "Product",
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
      index: true,
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Food", "Non-Food", "Service"],
      trim: true,
      index: true,
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: [
        "pcs",
        "kg",
        "sack",
        "box",
        "pack",
        "bottle",
        "can",
        "set",
        "bundle",
        "liter",
        "hour",
        "session",
        "service",
      ],
      trim: true,
      lowercase: true,
    },
    quantityOnHand: {
      type: Number,
      required: function (this: IInventoryItem) {
        return this.itemType === "Product";
      },
      default: 0,
      min: [0, "Quantity cannot be negative"],
    },
    quantityAsOfDate: {
      type: Date,
      required: function (this: IInventoryItem) {
        return this.itemType === "Product";
      },
      default: Date.now,
    },
    reorderLevel: {
      type: Number,
      required: function (this: IInventoryItem) {
        return this.itemType === "Product";
      },
      default: 0,
      min: [0, "Reorder level cannot be negative"],
    },
    unitCost: {
      type: Number,
      required: false, // Optional for services
      min: [0, "Unit cost cannot be negative"],
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },
    inventoryAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: function (this: IInventoryItem) {
        return this.itemType === "Product";
      },
      index: true,
    },
    cogsAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: function (this: IInventoryItem) {
        return this.itemType === "Product";
      },
      index: true,
    },
    incomeAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Income account ID is required"],
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
      index: true,
    },
    salesTaxEnabled: {
      type: Boolean,
      required: [true, "Sales tax enabled status is required"],
      default: false,
    },
    salesTaxRate: {
      type: Number,
      min: [0, "Sales tax rate cannot be negative"],
      max: [100, "Sales tax rate cannot exceed 100%"],
      default: null,
    },
    purchaseTaxRate: {
      type: Number,
      min: [0, "Purchase tax rate cannot be negative"],
      max: [100, "Purchase tax rate cannot exceed 100%"],
      default: null,
    },
    isActive: {
      type: Boolean,
      required: [true, "Active status is required"],
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "inventoryItems",
  },
);

/**
 * Indexes for performance
 */
InventoryItemSchema.index({ companyId: 1, sku: 1 }, { unique: true });
InventoryItemSchema.index({ companyId: 1, category: 1 });
InventoryItemSchema.index({ companyId: 1, isActive: 1 });
InventoryItemSchema.index({ companyId: 1, itemName: 1 });
InventoryItemSchema.index({ companyId: 1, supplierId: 1 });

/**
 * Virtual: Inventory value
 */
InventoryItemSchema.virtual("inventoryValue").get(function () {
  return this.quantityOnHand * this.unitCost;
});

/**
 * Virtual: Profit margin
 */
InventoryItemSchema.virtual("profitMargin").get(function () {
  if (this.sellingPrice === 0) return 0;
  return ((this.sellingPrice - this.unitCost) / this.sellingPrice) * 100;
});

/**
 * Virtual: Needs reorder
 */
InventoryItemSchema.virtual("needsReorder").get(function () {
  return this.quantityOnHand <= this.reorderLevel;
});

/**
 * Instance method: Adjust quantity
 */
InventoryItemSchema.methods.adjustQuantity = function (
  adjustment: number,
  reason: string,
) {
  const newQuantity = this.quantityOnHand + adjustment;
  if (newQuantity < 0) {
    throw new Error(
      `Insufficient inventory. Available: ${
        this.quantityOnHand
      }, Requested: ${Math.abs(adjustment)}`,
    );
  }
  this.quantityOnHand = newQuantity;
  return this.save();
};

/**
 * Instance method: Update cost
 */
InventoryItemSchema.methods.updateCost = function (newCost: number) {
  if (newCost < 0) {
    throw new Error("Unit cost cannot be negative");
  }
  this.unitCost = newCost;
  return this.save();
};

/**
 * Instance method: Update selling price
 */
InventoryItemSchema.methods.updateSellingPrice = function (newPrice: number) {
  if (newPrice < 0) {
    throw new Error("Selling price cannot be negative");
  }
  this.sellingPrice = newPrice;
  return this.save();
};

/**
 * Static method: Find active items
 */
InventoryItemSchema.statics.findActive = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.find({ companyId, isActive: true }).sort({ itemName: 1 });
};

/**
 * Static method: Find by SKU
 */
InventoryItemSchema.statics.findBySku = function (
  companyId: mongoose.Types.ObjectId,
  sku: string,
) {
  return this.findOne({ companyId, sku: sku.toUpperCase() });
};

/**
 * Static method: Find by category
 */
InventoryItemSchema.statics.findByCategory = function (
  companyId: mongoose.Types.ObjectId,
  category: string,
) {
  return this.find({ companyId, category, isActive: true }).sort({
    itemName: 1,
  });
};

/**
 * Static method: Find items needing reorder
 */
InventoryItemSchema.statics.findNeedingReorder = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.find({
    companyId,
    isActive: true,
    $expr: { $lte: ["$quantityOnHand", "$reorderLevel"] },
  }).sort({ itemName: 1 });
};

/**
 * Static method: Search items by name or SKU
 */
InventoryItemSchema.statics.searchItems = function (
  companyId: mongoose.Types.ObjectId,
  searchTerm: string,
) {
  const regex = new RegExp(searchTerm, "i");
  return this.find({
    companyId,
    isActive: true,
    $or: [{ itemName: regex }, { sku: regex }, { description: regex }],
  }).sort({ itemName: 1 });
};

/**
 * Static method: Get total inventory value
 */
InventoryItemSchema.statics.getTotalInventoryValue = async function (
  companyId: mongoose.Types.ObjectId,
) {
  const result = await this.aggregate([
    {
      $match: { companyId, isActive: true },
    },
    {
      $project: {
        inventoryValue: { $multiply: ["$quantityOnHand", "$unitCost"] },
      },
    },
    {
      $group: {
        _id: null,
        totalValue: { $sum: "$inventoryValue" },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalValue : 0;
};

/**
 * Export the model
 */
export const InventoryItem =
  (mongoose.models.InventoryItem as any) ||
  mongoose.model<IInventoryItemDocument>(
    "InventoryItem",
    InventoryItemSchema as any,
  );
