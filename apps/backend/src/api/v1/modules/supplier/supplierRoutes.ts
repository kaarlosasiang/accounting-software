import express, { Router } from "express";
import supplierController from "./supplierController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

const supplierRoutes: Router = express.Router();

// Apply auth middleware to all routes
supplierRoutes.use(requireAuth);

// Get all suppliers
supplierRoutes.get("/", supplierController.getAllSuppliers);

// Get active suppliers
supplierRoutes.get("/active", supplierController.getActiveSuppliers);

// Search suppliers
supplierRoutes.get("/search", supplierController.searchSuppliers);

// Get supplier by code
supplierRoutes.get("/code/:code", supplierController.getSupplierByCode);

// Create new supplier
supplierRoutes.post("/", supplierController.createSupplier);

// Get single supplier
supplierRoutes.get("/:id", supplierController.getSupplierById);

// Update supplier
supplierRoutes.put("/:id", supplierController.updateSupplier);

// Delete (deactivate) supplier
supplierRoutes.delete("/:id", supplierController.deleteSupplier);

export default supplierRoutes;
