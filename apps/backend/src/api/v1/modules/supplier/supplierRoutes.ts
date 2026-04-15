import express, { Router } from "express";
import supplierController from "./supplierController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const supplierRoutes: Router = express.Router();

// Apply auth middleware to all routes
supplierRoutes.use(requireAuth);

// Get all suppliers
supplierRoutes.get(
  "/",
  requirePermission(Resource.supplier, Action.read),
  supplierController.getAllSuppliers,
);

// Get active suppliers
supplierRoutes.get(
  "/active",
  requirePermission(Resource.supplier, Action.read),
  supplierController.getActiveSuppliers,
);

// Search suppliers
supplierRoutes.get(
  "/search",
  requirePermission(Resource.supplier, Action.read),
  supplierController.searchSuppliers,
);

// Get supplier by code
supplierRoutes.get(
  "/code/:code",
  requirePermission(Resource.supplier, Action.read),
  supplierController.getSupplierByCode,
);

// Create new supplier
supplierRoutes.post(
  "/",
  requirePermission(Resource.supplier, Action.create),
  supplierController.createSupplier,
);

// Get single supplier
supplierRoutes.get(
  "/:id",
  requirePermission(Resource.supplier, Action.read),
  supplierController.getSupplierById,
);

// Update supplier
supplierRoutes.put(
  "/:id",
  requirePermission(Resource.supplier, Action.update),
  supplierController.updateSupplier,
);

// Delete (deactivate) supplier
supplierRoutes.delete(
  "/:id",
  requirePermission(Resource.supplier, Action.delete),
  supplierController.deleteSupplier,
);

export default supplierRoutes;
