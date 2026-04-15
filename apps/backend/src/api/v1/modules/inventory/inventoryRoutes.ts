import express, { Router } from "express";
import inventoryController from "./inventoryController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const inventoryRoutes: Router = express.Router();

// Apply auth middleware to all routes
inventoryRoutes.use(requireAuth);

// Get all inventory items
inventoryRoutes.get(
  "/",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getAllItems,
);

// Get active inventory items
inventoryRoutes.get(
  "/active",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getActiveItems,
);

// Get items needing reorder
inventoryRoutes.get(
  "/reorder/needed",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getItemsNeedingReorder,
);

// Get total inventory value
inventoryRoutes.get(
  "/value/total",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getTotalInventoryValue,
);

// Get inventory valuation report
inventoryRoutes.get(
  "/reports/valuation",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getInventoryValuation,
);

// Get all transactions
inventoryRoutes.get(
  "/transactions/all",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getAllTransactions,
);

// Search inventory items
inventoryRoutes.get(
  "/search",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.searchItems,
);

// Get inventory item by SKU
inventoryRoutes.get(
  "/sku/:sku",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getItemBySku,
);

// Get inventory items by category
inventoryRoutes.get(
  "/category/:category",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getItemsByCategory,
);

// Create new inventory item
inventoryRoutes.post(
  "/",
  requirePermission(Resource.inventory, Action.create),
  inventoryController.createItem,
);

// Get single inventory item
inventoryRoutes.get(
  "/:id",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getItemById,
);

// Update inventory item
inventoryRoutes.put(
  "/:id",
  requirePermission(Resource.inventory, Action.update),
  inventoryController.updateItem,
);

// Delete (deactivate) inventory item
inventoryRoutes.delete(
  "/:id",
  requirePermission(Resource.inventory, Action.delete),
  inventoryController.deleteItem,
);

// Adjust inventory quantity
inventoryRoutes.post(
  "/:id/adjust",
  requirePermission(Resource.inventory, Action.update),
  inventoryController.adjustQuantity,
);

// Get item transactions
inventoryRoutes.get(
  "/:id/transactions",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getItemTransactions,
);

// Get movement summary
inventoryRoutes.get(
  "/:id/movement-summary",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.getMovementSummary,
);

// Calculate COGS
inventoryRoutes.get(
  "/:id/cogs",
  requirePermission(Resource.inventory, Action.read),
  inventoryController.calculateCOGS,
);

export default inventoryRoutes;
