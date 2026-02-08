import { Request, Response } from "express";
import { inventoryItemSchema } from "@rrd10-sas/validators";
import inventoryService from "./inventoryService.js";
import logger from "../../config/logger.js";
import { getCompanyId } from "../../shared/helpers/utils.js";

/**
 * Inventory Controller
 * Handles HTTP requests for inventory operations
 */

const inventoryController = {
  /**
   * GET /api/v1/inventory
   * Get all inventory items for the company
   */
  getAllItems: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      logger.debug("Fetched companyId for inventory", { companyId });
      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const items = await inventoryService.getAllItems(companyId);

      return res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-inventory-items-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch inventory items",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/active
   * Get active inventory items
   */
  getActiveItems: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const items = await inventoryService.getActiveItems(companyId);

      return res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-active-inventory-items-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch active inventory items",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/:id
   * Get a single inventory item
   */
  getItemById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const item = await inventoryService.getItemById(companyId, id);

      return res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-inventory-item-by-id-controller",
      });

      if ((error as Error).message === "Inventory item not found") {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch inventory item",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/sku/:sku
   * Get inventory item by SKU
   */
  getItemBySku: async (req: Request, res: Response) => {
    try {
      const { sku } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const item = await inventoryService.getItemBySku(companyId, sku);

      return res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-inventory-item-by-sku-controller",
      });

      if ((error as Error).message === "Inventory item not found") {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch inventory item",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/category/:category
   * Get inventory items by category
   */
  getItemsByCategory: async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const items = await inventoryService.getItemsByCategory(
        companyId,
        category,
      );

      return res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-inventory-items-by-category-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch inventory items by category",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/reorder/needed
   * Get items needing reorder
   */
  getItemsNeedingReorder: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const items = await inventoryService.getItemsNeedingReorder(companyId);

      return res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-items-needing-reorder-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch items needing reorder",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/search
   * Search inventory items
   */
  searchItems: async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search term is required",
        });
      }

      const items = await inventoryService.searchItems(companyId, q);

      return res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "search-inventory-items-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to search inventory items",
        error: (error as Error).message,
      });
    }
  },

  /**
   * POST /api/v1/inventory
   * Create a new inventory item
   */
  createItem: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const itemData = req.body;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      // Validate request body
      const validationResult = inventoryItemSchema.safeParse(itemData);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      // Filter out services - they should be handled separately
      if (validationResult.data.itemType === "Service") {
        return res.status(400).json({
          success: false,
          message: "Services should be created using the service endpoint",
        });
      }

      // Create filtered data object that matches the service expectations
      const validUnits = [
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
      ] as const;
      const filteredData = {
        sku: validationResult.data.sku,
        itemName: validationResult.data.itemName,
        description: validationResult.data.description,
        category: validationResult.data.category as "Food" | "Non-Food",
        unit: (validUnits.includes(validationResult.data.unit as any)
          ? validationResult.data.unit
          : "pcs") as any,
        quantityOnHand: validationResult.data.quantityOnHand,
        reorderLevel: validationResult.data.reorderLevel,
        unitCost: validationResult.data.unitCost,
        sellingPrice: validationResult.data.sellingPrice,
        inventoryAccountId: validationResult.data.inventoryAccountId || "",
        cogsAccountId: validationResult.data.cogsAccountId || "",
        incomeAccountId: validationResult.data.incomeAccountId || "",
        supplierId: validationResult.data.supplierId,
        salesTaxEnabled: validationResult.data.salesTaxEnabled,
        salesTaxRate: validationResult.data.salesTaxRate,
        purchaseTaxRate: validationResult.data.purchaseTaxRate,
        isActive: validationResult.data.isActive,
      };

      const item = await inventoryService.createItem(companyId, filteredData);

      return res.status(201).json({
        success: true,
        message: "Inventory item created successfully",
        data: item,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-inventory-item-controller",
      });

      if ((error as Error).message.includes("already exists")) {
        return res.status(409).json({
          success: false,
          message: (error as Error).message,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to create inventory item",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PUT /api/v1/inventory/:id
   * Update an inventory item
   */
  updateItem: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const updateData = req.body;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      // Validate request body (partial update)
      const validationResult = inventoryItemSchema
        .partial()
        .safeParse(updateData);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      // Filter out services - they should be handled separately
      if (validationResult.data.itemType === "Service") {
        return res.status(400).json({
          success: false,
          message: "Services should be updated using the service endpoint",
        });
      }

      // Create filtered data object that matches the service expectations
      const validUnits = [
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
      ] as const;
      const filteredData: any = {};
      if (validationResult.data.sku !== undefined)
        filteredData.sku = validationResult.data.sku;
      if (validationResult.data.itemName !== undefined)
        filteredData.itemName = validationResult.data.itemName;
      if (validationResult.data.description !== undefined)
        filteredData.description = validationResult.data.description;
      if (validationResult.data.category !== undefined)
        filteredData.category = validationResult.data.category;
      if (validationResult.data.unit !== undefined) {
        filteredData.unit = (
          validUnits.includes(validationResult.data.unit as any)
            ? validationResult.data.unit
            : "pcs"
        ) as any;
      }
      if (validationResult.data.quantityOnHand !== undefined)
        filteredData.quantityOnHand = validationResult.data.quantityOnHand;
      if (validationResult.data.reorderLevel !== undefined)
        filteredData.reorderLevel = validationResult.data.reorderLevel;
      if (validationResult.data.unitCost !== undefined)
        filteredData.unitCost = validationResult.data.unitCost;
      if (validationResult.data.sellingPrice !== undefined)
        filteredData.sellingPrice = validationResult.data.sellingPrice;
      if (validationResult.data.inventoryAccountId !== undefined)
        filteredData.inventoryAccountId =
          validationResult.data.inventoryAccountId;
      if (validationResult.data.cogsAccountId !== undefined)
        filteredData.cogsAccountId = validationResult.data.cogsAccountId;
      if (validationResult.data.incomeAccountId !== undefined)
        filteredData.incomeAccountId = validationResult.data.incomeAccountId;
      if (validationResult.data.supplierId !== undefined)
        filteredData.supplierId = validationResult.data.supplierId;
      if (validationResult.data.salesTaxEnabled !== undefined)
        filteredData.salesTaxEnabled = validationResult.data.salesTaxEnabled;
      if (validationResult.data.salesTaxRate !== undefined)
        filteredData.salesTaxRate = validationResult.data.salesTaxRate;
      if (validationResult.data.purchaseTaxRate !== undefined)
        filteredData.purchaseTaxRate = validationResult.data.purchaseTaxRate;
      if (validationResult.data.isActive !== undefined)
        filteredData.isActive = validationResult.data.isActive;

      const item = await inventoryService.updateItem(
        companyId,
        id,
        filteredData,
      );

      return res.status(200).json({
        success: true,
        message: "Inventory item updated successfully",
        data: item,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-inventory-item-controller",
      });

      if ((error as Error).message === "Inventory item not found") {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to update inventory item",
        error: (error as Error).message,
      });
    }
  },

  /**
   * DELETE /api/v1/inventory/:id
   * Delete (deactivate) an inventory item
   */
  deleteItem: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const item = await inventoryService.deleteItem(companyId, id);

      return res.status(200).json({
        success: true,
        message: "Inventory item deleted successfully",
        data: item,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-inventory-item-controller",
      });

      if ((error as Error).message === "Inventory item not found") {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to delete inventory item",
        error: (error as Error).message,
      });
    }
  },

  /**
   * POST /api/v1/inventory/:id/adjust
   * Adjust inventory quantity
   */
  adjustQuantity: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const userId = req.authUser?.id;
      const { adjustment, reason } = req.body;

      if (!companyId || !userId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID and User ID are required",
        });
      }

      if (adjustment === undefined || !reason) {
        return res.status(400).json({
          success: false,
          message: "Adjustment amount and reason are required",
        });
      }

      const item = await inventoryService.adjustQuantity(
        companyId,
        id,
        adjustment,
        reason,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Inventory quantity adjusted successfully",
        data: item,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "adjust-inventory-quantity-controller",
      });

      if ((error as Error).message === "Inventory item not found") {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found",
        });
      }

      if ((error as Error).message.includes("Insufficient inventory")) {
        return res.status(400).json({
          success: false,
          message: (error as Error).message,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to adjust inventory quantity",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/value/total
   * Get total inventory value
   */
  getTotalInventoryValue: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const totalValue =
        await inventoryService.getTotalInventoryValue(companyId);

      return res.status(200).json({
        success: true,
        data: { totalValue },
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-total-inventory-value-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch total inventory value",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/:id/transactions
   * Get inventory transactions for an item
   */
  getItemTransactions: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const transactions = await inventoryService.getItemTransactions(
        companyId,
        id,
      );

      return res.status(200).json({
        success: true,
        data: transactions,
        count: transactions.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-item-transactions-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch item transactions",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/transactions/all
   * Get all inventory transactions for the company
   */
  getAllTransactions: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const transactions = await inventoryService.getAllTransactions(companyId);

      return res.status(200).json({
        success: true,
        data: transactions,
        count: transactions.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-transactions-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch transactions",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/:id/movement-summary
   * Get inventory movement summary
   */
  getMovementSummary: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const summary = await inventoryService.getMovementSummary(
        id,
        new Date(startDate as string),
        new Date(endDate as string),
      );

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-movement-summary-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch movement summary",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/:id/cogs
   * Calculate COGS for an item
   */
  calculateCOGS: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const cogs = await inventoryService.calculateCOGS(
        id,
        new Date(startDate as string),
        new Date(endDate as string),
      );

      return res.status(200).json({
        success: true,
        data: cogs,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "calculate-cogs-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to calculate COGS",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/inventory/reports/valuation
   * Get inventory valuation report
   */
  getInventoryValuation: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const valuation = await inventoryService.getInventoryValuation(companyId);

      return res.status(200).json({
        success: true,
        data: valuation,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-inventory-valuation-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch inventory valuation",
        error: (error as Error).message,
      });
    }
  },
};

export default inventoryController;
