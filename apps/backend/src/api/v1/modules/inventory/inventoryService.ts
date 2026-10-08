import mongoose, { ClientSession, Types } from "mongoose";

import logger from "../../config/logger.js";
import { InventoryItem } from "../../models/InventoryItem.js";
import { InventoryTransaction } from "../../models/InventoryTransaction.js";
import {
  findSystemAccount,
  getOrCreateOpeningBalanceEquity,
  SystemAccount,
} from "../../services/accountResolver.js";
import { JournalEntryService } from "../../services/journalEntryService.js";
import { round2 } from "../../shared/helpers/money.js";
import {
  InventoryReferenceType,
  InventoryTransactionType,
} from "../../shared/interface/IInventoryTransaction.js";
import { JournalEntryType } from "../../shared/interface/IJournalEntry.js";

/**
 * Post a change in the value of an item's stock to the general ledger.
 *
 *   amount > 0: Dr Inventory / Cr offset   (stock value increases)
 *   amount < 0: Dr offset   / Cr Inventory (stock value decreases)
 *
 * The offset is Inventory Adjustment (shrinkage, count corrections,
 * revaluations) or Opening Balance Equity (opening stock). Returns the
 * journal entry id, or null when nothing was posted (zero value, or the
 * chart of accounts has no suitable accounts — logged as a warning).
 */
async function postInventoryValueChange(params: {
  companyId: string | Types.ObjectId;
  item: { _id: unknown; itemName: string; inventoryAccountId?: unknown };
  amount: number;
  offset: "adjustment" | "openingEquity";
  userId: string | Types.ObjectId;
  description: string;
  session: ClientSession;
}): Promise<Types.ObjectId | null> {
  const amount = round2(params.amount);
  if (amount === 0) return null;

  const inventoryAccountId =
    params.item.inventoryAccountId ??
    (
      await findSystemAccount(
        params.companyId,
        SystemAccount.INVENTORY,
        params.session,
      )
    )?._id;
  const offsetAccountId =
    params.offset === "openingEquity"
      ? (
          await getOrCreateOpeningBalanceEquity(
            params.companyId,
            params.session,
          )
        )._id
      : (
          await findSystemAccount(
            params.companyId,
            SystemAccount.INVENTORY_ADJUSTMENT,
            params.session,
          )
        )?._id;

  if (!inventoryAccountId || !offsetAccountId) {
    logger.warn("Inventory value change not posted: missing accounts", {
      companyId: String(params.companyId),
      itemId: String(params.item._id),
      amount,
    });
    return null;
  }

  const value = Math.abs(amount);
  const increase = amount > 0;
  const entry = await JournalEntryService.postEntry({
    companyId: params.companyId,
    userId: params.userId,
    entryDate: new Date(),
    entryType: JournalEntryType.MANUAL,
    description: params.description,
    referenceNumber: "INVENTORY",
    lines: [
      {
        accountId: String(inventoryAccountId),
        debit: increase ? value : 0,
        credit: increase ? 0 : value,
        description: params.description,
      },
      {
        accountId: String(offsetAccountId),
        debit: increase ? 0 : value,
        credit: increase ? value : 0,
        description: params.description,
      },
    ],
    session: params.session,
  });
  return entry._id as Types.ObjectId;
}

/** Run `fn` in a transaction, aborting on error. */
async function inTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Inventory Service
 * Handles all inventory-related business logic
 */
const inventoryService = {
  /**
   * Get all inventory items for a company
   */
  getAllItems: async (companyId: string | Types.ObjectId) => {
    try {
      const items = await InventoryItem.find({ companyId })
        .populate("inventoryAccountId", "accountCode accountName")
        .populate("cogsAccountId", "accountCode accountName")
        .populate("incomeAccountId", "accountCode accountName")
        .sort({ itemName: 1 });
      return items;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-inventory-items",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get active inventory items
   */
  getActiveItems: async (companyId: string | Types.ObjectId) => {
    try {
      const items = await InventoryItem.findActive(
        new Types.ObjectId(companyId),
      );
      return items;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-active-inventory-items",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get single inventory item by ID
   */
  getItemById: async (
    companyId: string | Types.ObjectId,
    itemId: string | Types.ObjectId,
  ) => {
    try {
      const item = await InventoryItem.findOne({
        _id: itemId,
        companyId,
      })
        .populate("inventoryAccountId", "accountCode accountName")
        .populate("cogsAccountId", "accountCode accountName")
        .populate("incomeAccountId", "accountCode accountName");

      if (!item) {
        throw new Error("Inventory item not found");
      }
      return item;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-inventory-item-by-id",
        companyId: companyId.toString(),
        itemId: itemId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get inventory item by SKU
   */
  getItemBySku: async (companyId: string | Types.ObjectId, sku: string) => {
    try {
      const item = await InventoryItem.findBySku(
        new Types.ObjectId(companyId),
        sku,
      );
      if (!item) {
        throw new Error("Inventory item not found");
      }
      return item;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-inventory-item-by-sku",
        companyId: companyId.toString(),
        sku,
      });
      throw error;
    }
  },

  /**
   * Get inventory items by category
   */
  getItemsByCategory: async (
    companyId: string | Types.ObjectId,
    category: string,
  ) => {
    try {
      const items = await InventoryItem.findByCategory(
        new Types.ObjectId(companyId),
        category,
      );
      return items;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-inventory-items-by-category",
        companyId: companyId.toString(),
        category,
      });
      throw error;
    }
  },

  /**
   * Get items needing reorder
   */
  getItemsNeedingReorder: async (companyId: string | Types.ObjectId) => {
    try {
      const items = await InventoryItem.findNeedingReorder(
        new Types.ObjectId(companyId),
      );
      return items;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-items-needing-reorder",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Search inventory items
   */
  searchItems: async (
    companyId: string | Types.ObjectId,
    searchTerm: string,
  ) => {
    try {
      const items = await InventoryItem.searchItems(
        new Types.ObjectId(companyId),
        searchTerm,
      );
      return items;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "search-inventory-items",
        companyId: companyId.toString(),
        searchTerm,
      });
      throw error;
    }
  },

  /**
   * Create new inventory item
   */
  createItem: async (
    companyId: string | Types.ObjectId,
    itemData: {
      sku: string;
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
      quantityOnHand?: number;
      quantityAsOfDate?: Date;
      reorderLevel?: number;
      unitCost: number;
      sellingPrice: number;
      inventoryAccountId: string | Types.ObjectId;
      cogsAccountId: string | Types.ObjectId;
      incomeAccountId: string | Types.ObjectId;
      supplierId?: string | Types.ObjectId;
      salesTaxEnabled: boolean;
      salesTaxRate?: number;
      purchaseTaxRate?: number;
      isActive?: boolean;
    },
    userId?: string | Types.ObjectId,
  ) => {
    try {
      // Check if SKU already exists
      const existingItem = await InventoryItem.findBySku(
        new Types.ObjectId(companyId),
        itemData.sku,
      );

      if (existingItem) {
        throw new Error(
          `Item with SKU ${itemData.sku} already exists for this company`,
        );
      }

      const item = await inTransaction(async (session) => {
        const created = new InventoryItem({
          ...itemData,
          companyId,
          quantityOnHand: itemData.quantityOnHand ?? 0,
          quantityAsOfDate: itemData.quantityAsOfDate ?? new Date(),
          reorderLevel: itemData.reorderLevel ?? 0,
          isActive: itemData.isActive ?? true,
        });
        await created.save({ session });

        // Opening stock has a value that must be on the books.
        const openingValue =
          created.itemType === "Product"
            ? (created.quantityOnHand || 0) * (created.unitCost || 0)
            : 0;
        if (openingValue > 0 && userId) {
          await postInventoryValueChange({
            companyId,
            item: created,
            amount: openingValue,
            offset: "openingEquity",
            userId,
            description: `Opening stock - ${created.itemName}`,
            session,
          });
        }
        return created;
      });

      logger.info("Inventory item created successfully", {
        itemId: item._id,
        sku: item.sku,
        companyId: companyId.toString(),
      });

      return item;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-inventory-item",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Update inventory item
   */
  updateItem: async (
    companyId: string | Types.ObjectId,
    itemId: string | Types.ObjectId,
    updateData: Partial<{
      itemName: string;
      description: string;
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
      reorderLevel: number;
      unitCost: number;
      sellingPrice: number;
      inventoryAccountId: string | Types.ObjectId;
      cogsAccountId: string | Types.ObjectId;
      incomeAccountId: string | Types.ObjectId;
      supplierId: string | Types.ObjectId;
      salesTaxEnabled: boolean;
      salesTaxRate: number;
      purchaseTaxRate: number;
      isActive: boolean;
    }>,
    userId?: string | Types.ObjectId,
  ) => {
    try {
      // Quantities only change through bills, invoices and adjustments.
      const {
        quantityOnHand: _qty,
        companyId: _company,
        ...changes
      } = updateData as Record<string, unknown>;

      await inTransaction(async (session) => {
        const current = await InventoryItem.findOne({
          _id: itemId,
          companyId,
        }).session(session);
        if (!current) {
          throw new Error("Inventory item not found");
        }

        // A unit-cost correction revalues the stock on hand.
        const newCost =
          changes.unitCost !== undefined ? Number(changes.unitCost) : null;
        const revaluation =
          newCost !== null && current.itemType === "Product"
            ? round2(
                (newCost - (current.unitCost || 0)) *
                  (current.quantityOnHand || 0),
              )
            : 0;

        await InventoryItem.updateOne(
          { _id: itemId, companyId },
          { $set: changes },
          { runValidators: true, session },
        );

        if (revaluation !== 0) {
          if (!userId) {
            throw new Error("A user is required to revalue inventory");
          }
          await postInventoryValueChange({
            companyId,
            item: current,
            amount: revaluation,
            offset: "adjustment",
            userId,
            description: `Cost revaluation - ${current.itemName}`,
            session,
          });
        }
      });

      const item = await InventoryItem.findOne({ _id: itemId, companyId })
        .populate("inventoryAccountId", "accountCode accountName")
        .populate("cogsAccountId", "accountCode accountName")
        .populate("incomeAccountId", "accountCode accountName")
        .populate("supplierId", "supplierName");

      if (!item) {
        throw new Error("Inventory item not found");
      }

      logger.info("Inventory item updated successfully", {
        itemId: item._id,
        sku: item.sku,
        companyId: companyId.toString(),
      });

      return item;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-inventory-item",
        companyId: companyId.toString(),
        itemId: itemId.toString(),
      });
      throw error;
    }
  },

  /**
   * Delete (deactivate) inventory item
   */
  deleteItem: async (
    companyId: string | Types.ObjectId,
    itemId: string | Types.ObjectId,
  ) => {
    try {
      const item = await InventoryItem.findOneAndUpdate(
        { _id: itemId, companyId },
        { $set: { isActive: false } },
        { new: true },
      );

      if (!item) {
        throw new Error("Inventory item not found");
      }

      logger.info("Inventory item deactivated successfully", {
        itemId: item._id,
        sku: item.sku,
        companyId: companyId.toString(),
      });

      return item;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-inventory-item",
        companyId: companyId.toString(),
        itemId: itemId.toString(),
      });
      throw error;
    }
  },

  /**
   * Adjust inventory quantity
   */
  adjustQuantity: async (
    companyId: string | Types.ObjectId,
    itemId: string | Types.ObjectId,
    adjustment: number,
    reason: string,
    userId: string | Types.ObjectId,
  ) => {
    try {
      const item = await inTransaction(async (session) => {
        const found = await InventoryItem.findOne({
          _id: itemId,
          companyId,
        }).session(session);

        if (!found) {
          throw new Error("Inventory item not found");
        }

        const newQuantity = (found.quantityOnHand || 0) + adjustment;
        if (newQuantity < 0) {
          throw new Error(
            `Insufficient inventory. Available: ${found.quantityOnHand}, Requested: ${Math.abs(adjustment)}`,
          );
        }
        found.quantityOnHand = newQuantity;
        await found.save({ session });

        const unitCost = found.unitCost || 0;
        const value = round2(adjustment * unitCost);

        // Shrinkage / count corrections change the value of stock.
        const journalEntryId =
          found.itemType === "Product"
            ? await postInventoryValueChange({
                companyId,
                item: found,
                amount: value,
                offset: "adjustment",
                userId,
                description: `Inventory adjustment - ${found.itemName}: ${reason}`,
                session,
              })
            : null;

        await new InventoryTransaction({
          companyId,
          inventoryItemId: itemId,
          transactionType: InventoryTransactionType.ADJUSTMENT,
          transactionDate: new Date(),
          referenceType: InventoryReferenceType.JOURNAL_ENTRY,
          referenceId: journalEntryId ?? found._id,
          quantityIn: adjustment > 0 ? adjustment : 0,
          quantityOut: adjustment < 0 ? Math.abs(adjustment) : 0,
          unitCost,
          totalValue: Math.abs(value),
          balanceAfter: found.quantityOnHand,
          notes: reason,
          createdBy: userId,
        }).save({ session });

        return found;
      });

      logger.info("Inventory quantity adjusted successfully", {
        itemId: item._id,
        adjustment,
        newQuantity: item.quantityOnHand,
        companyId: companyId.toString(),
      });

      return item;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "adjust-inventory-quantity",
        companyId: companyId.toString(),
        itemId: itemId.toString(),
        adjustment,
      });
      throw error;
    }
  },

  /**
   * Get total inventory value
   */
  getTotalInventoryValue: async (companyId: string | Types.ObjectId) => {
    try {
      const totalValue = await InventoryItem.getTotalInventoryValue(
        new Types.ObjectId(companyId),
      );
      return totalValue;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-total-inventory-value",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get inventory transactions for an item
   */
  getItemTransactions: async (
    companyId: string | Types.ObjectId,
    itemId: string | Types.ObjectId,
  ) => {
    try {
      const transactions = await InventoryTransaction.find({
        inventoryItemId: new Types.ObjectId(itemId),
        companyId: new Types.ObjectId(companyId),
      })
        .populate("createdBy", "first_name last_name email")
        .populate("inventoryItemId", "sku itemName")
        .sort({ transactionDate: -1 });

      return transactions;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-item-transactions",
        companyId: companyId.toString(),
        itemId: itemId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get all inventory transactions for a company
   */
  getAllTransactions: async (companyId: string | Types.ObjectId) => {
    try {
      const transactions = await InventoryTransaction.find({
        companyId: new Types.ObjectId(companyId),
      })
        .populate("createdBy", "first_name last_name email")
        .populate("inventoryItemId", "sku itemName category unit")
        .sort({ transactionDate: -1 });

      return transactions;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-transactions",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get inventory movement summary
   */
  getMovementSummary: async (
    itemId: string | Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ) => {
    try {
      const summary = await InventoryTransaction.getMovementSummary(
        new Types.ObjectId(itemId),
        startDate,
        endDate,
      );
      return summary;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-inventory-movement-summary",
        itemId: itemId.toString(),
      });
      throw error;
    }
  },

  /**
   * Calculate COGS for an item
   */
  calculateCOGS: async (
    itemId: string | Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ) => {
    try {
      const cogs = await InventoryTransaction.calculateCOGS(
        new Types.ObjectId(itemId),
        startDate,
        endDate,
      );
      return cogs;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "calculate-cogs",
        itemId: itemId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get inventory valuation report
   */
  getInventoryValuation: async (companyId: string | Types.ObjectId) => {
    try {
      const items = await InventoryItem.find({ companyId, isActive: true })
        .select("sku itemName category quantityOnHand unitCost sellingPrice")
        .sort({ category: 1, itemName: 1 });

      const valuation = items.map((item: any) => ({
        sku: item.sku,
        itemName: item.itemName,
        category: item.category,
        quantityOnHand: item.quantityOnHand,
        unitCost: item.unitCost,
        sellingPrice: item.sellingPrice,
        inventoryValue: item.quantityOnHand * item.unitCost,
        potentialRevenue: item.quantityOnHand * item.sellingPrice,
        potentialProfit:
          item.quantityOnHand * (item.sellingPrice - item.unitCost),
      }));

      const totals = valuation.reduce(
        (acc: any, item: any) => ({
          totalInventoryValue: acc.totalInventoryValue + item.inventoryValue,
          totalPotentialRevenue:
            acc.totalPotentialRevenue + item.potentialRevenue,
          totalPotentialProfit: acc.totalPotentialProfit + item.potentialProfit,
        }),
        {
          totalInventoryValue: 0,
          totalPotentialRevenue: 0,
          totalPotentialProfit: 0,
        },
      );

      return {
        items: valuation,
        totals,
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-inventory-valuation",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },
};

export default inventoryService;
