import express, { Router } from "express";
import inventoryController from "./inventoryController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

const inventoryRoutes: Router = express.Router();

// Apply auth middleware to all routes
inventoryRoutes.use(requireAuth);

// Get all inventory items
inventoryRoutes.get("/", inventoryController.getAllItems);

// Get active inventory items
inventoryRoutes.get("/active", inventoryController.getActiveItems);

// Get items needing reorder
inventoryRoutes.get(
  "/reorder/needed",
  inventoryController.getItemsNeedingReorder,
);

// Get total inventory value
inventoryRoutes.get("/value/total", inventoryController.getTotalInventoryValue);

// Get inventory valuation report
inventoryRoutes.get(
  "/reports/valuation",
  inventoryController.getInventoryValuation,
);

// Get all transactions
inventoryRoutes.get(
  "/transactions/all",
  inventoryController.getAllTransactions,
);

// Search inventory items
inventoryRoutes.get("/search", inventoryController.searchItems);

// Get inventory item by SKU
inventoryRoutes.get("/sku/:sku", inventoryController.getItemBySku);

// Get inventory items by category
inventoryRoutes.get(
  "/category/:category",
  inventoryController.getItemsByCategory,
);

// Create new inventory item
inventoryRoutes.post("/", inventoryController.createItem);

// Get single inventory item
inventoryRoutes.get("/:id", inventoryController.getItemById);

// Update inventory item
inventoryRoutes.put("/:id", inventoryController.updateItem);

// Delete (deactivate) inventory item
inventoryRoutes.delete("/:id", inventoryController.deleteItem);

// Adjust inventory quantity
inventoryRoutes.post("/:id/adjust", inventoryController.adjustQuantity);

// Get item transactions
inventoryRoutes.get(
  "/:id/transactions",
  inventoryController.getItemTransactions,
);

// Get movement summary
inventoryRoutes.get(
  "/:id/movement-summary",
  inventoryController.getMovementSummary,
);

// Calculate COGS
inventoryRoutes.get("/:id/cogs", inventoryController.calculateCOGS);

export default inventoryRoutes;
