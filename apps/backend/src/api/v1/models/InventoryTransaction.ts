import mongoose, { Schema, Model } from "mongoose";

import {
  IInventoryTransaction,
  IInventoryTransactionDocument,
  IInventoryTransactionModel,
  InventoryReferenceType,
  InventoryTransactionType,
} from "../shared/interface/IInventoryTransaction.js";

/**
 * Inventory Transaction Schema
 */
const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: [true, "Inventory item ID is required"],
      index: true,
    },
    transactionType: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: {
        values: Object.values(InventoryTransactionType),
        message: "Invalid transaction type",
      },
      index: true,
    },
    transactionDate: {
      type: Date,
      required: [true, "Transaction date is required"],
      index: true,
    },
    referenceType: {
      type: String,
      required: [true, "Reference type is required"],
      enum: {
        values: Object.values(InventoryReferenceType),
        message: "Invalid reference type",
      },
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: [true, "Reference ID is required"],
      refPath: "referenceType",
      index: true,
    },
    quantityIn: {
      type: Number,
      required: [true, "Quantity in is required"],
      default: 0,
      min: [0, "Quantity in cannot be negative"],
    },
    quantityOut: {
      type: Number,
      required: [true, "Quantity out is required"],
      default: 0,
      min: [0, "Quantity out cannot be negative"],
    },
    unitCost: {
      type: Number,
      required: [true, "Unit cost is required"],
      min: [0, "Unit cost cannot be negative"],
    },
    totalValue: {
      type: Number,
      required: [true, "Total value is required"],
    },
    balanceAfter: {
      type: Number,
      required: [true, "Balance after is required"],
      min: [0, "Balance cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "inventoryTransactions",
  }
);

/**
 * Indexes for performance
 */
InventoryTransactionSchema.index({ companyId: 1, inventoryItemId: 1 });
InventoryTransactionSchema.index({ companyId: 1, transactionType: 1 });
InventoryTransactionSchema.index({ companyId: 1, transactionDate: -1 });
InventoryTransactionSchema.index({ inventoryItemId: 1, transactionDate: 1 });
InventoryTransactionSchema.index({ referenceType: 1, referenceId: 1 });

/**
 * Pre-save: Calculate total value
 */
InventoryTransactionSchema.pre("save", function () {
  const quantity =
    this.transactionType === InventoryTransactionType.PURCHASE ||
    this.transactionType === InventoryTransactionType.ADJUSTMENT
      ? this.quantityIn
      : this.quantityOut;

  this.totalValue = quantity * this.unitCost;
});

/**
 * Pre-save validation: Ensure only quantityIn OR quantityOut is set
 */
InventoryTransactionSchema.pre("save", function () {
  if (this.quantityIn > 0 && this.quantityOut > 0) {
    throw new Error(
      "A transaction cannot have both quantity in and quantity out. One must be zero."
    );
  }

  if (this.quantityIn === 0 && this.quantityOut === 0) {
    throw new Error(
      "A transaction must have either quantity in or quantity out greater than zero."
    );
  }

  // Validate transaction type matches quantity direction
  if (
    this.transactionType === InventoryTransactionType.PURCHASE &&
    this.quantityIn === 0
  ) {
    throw new Error("Purchase transactions must have quantity in");
  }

  if (
    this.transactionType === InventoryTransactionType.SALE &&
    this.quantityOut === 0
  ) {
    throw new Error("Sale transactions must have quantity out");
  }
});

/**
 * Static method: Find transactions by inventory item
 */
InventoryTransactionSchema.statics.findByInventoryItem = function (
  inventoryItemId: mongoose.Types.ObjectId
) {
  return this.find({ inventoryItemId }).sort({ transactionDate: -1 });
};

/**
 * Static method: Find transactions by type
 */
InventoryTransactionSchema.statics.findByType = function (
  companyId: mongoose.Types.ObjectId,
  transactionType: InventoryTransactionType
) {
  return this.find({ companyId, transactionType }).sort({
    transactionDate: -1,
  });
};

/**
 * Static method: Find transactions by date range
 */
InventoryTransactionSchema.statics.findByDateRange = function (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    companyId,
    transactionDate: { $gte: startDate, $lte: endDate },
  }).sort({ transactionDate: -1 });
};

/**
 * Static method: Find transactions by reference
 */
InventoryTransactionSchema.statics.findByReference = function (
  referenceType: InventoryReferenceType,
  referenceId: mongoose.Types.ObjectId
) {
  return this.find({ referenceType, referenceId }).sort({
    transactionDate: -1,
  });
};

/**
 * Static method: Get inventory movement summary
 */
InventoryTransactionSchema.statics.getMovementSummary = async function (
  inventoryItemId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const result = await this.aggregate([
    {
      $match: {
        inventoryItemId,
        transactionDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$transactionType",
        totalIn: { $sum: "$quantityIn" },
        totalOut: { $sum: "$quantityOut" },
        totalValue: { $sum: "$totalValue" },
        count: { $sum: 1 },
      },
    },
  ]);

  return result;
};

/**
 * Static method: Calculate COGS (Cost of Goods Sold)
 */
InventoryTransactionSchema.statics.calculateCOGS = async function (
  inventoryItemId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const result = await this.aggregate([
    {
      $match: {
        inventoryItemId,
        transactionType: InventoryTransactionType.SALE,
        transactionDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalCOGS: { $sum: "$totalValue" },
        totalQuantitySold: { $sum: "$quantityOut" },
      },
    },
  ]);

  return result.length > 0
    ? {
        totalCOGS: result[0].totalCOGS,
        totalQuantitySold: result[0].totalQuantitySold,
        averageCost:
          result[0].totalQuantitySold > 0
            ? result[0].totalCOGS / result[0].totalQuantitySold
            : 0,
      }
    : { totalCOGS: 0, totalQuantitySold: 0, averageCost: 0 };
};

/**
 * Export the model
 */
export const InventoryTransaction =
  (mongoose.models.InventoryTransaction as any) ||
  mongoose.model<IInventoryTransactionDocument>(
    "InventoryTransaction",
    InventoryTransactionSchema as any
  );
