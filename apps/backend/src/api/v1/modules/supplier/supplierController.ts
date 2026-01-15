import { Request, Response } from "express";
import { supplierSchema } from "@rrd10-sas/validators";
import supplierService from "./supplierService.js";
import logger from "../../config/logger.js";
import { getCompanyId } from "../../shared/helpers/utils.js";

/**
 * Supplier Controller
 * Handles HTTP requests for supplier operations
 */

const supplierController = {
  /**
   * GET /api/v1/suppliers
   * Get all suppliers for the company
   */
  getAllSuppliers: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const suppliers = await supplierService.getAllSuppliers(companyId);

      return res.status(200).json({
        success: true,
        data: suppliers,
        count: suppliers.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-suppliers-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch suppliers",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/suppliers/active
   * Get active suppliers
   */
  getActiveSuppliers: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const suppliers = await supplierService.getActiveSuppliers(
        companyId
      );

      return res.status(200).json({
        success: true,
        data: suppliers,
        count: suppliers.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-active-suppliers-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch active suppliers",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/suppliers/:id
   * Get a single supplier
   */
  getSupplierById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const supplier = await supplierService.getSupplierById(
        companyId,
        id
      );

      return res.status(200).json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-supplier-by-id-controller",
      });

      if ((error as Error).message === "Supplier not found") {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch supplier",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/suppliers/code/:code
   * Get supplier by supplier code
   */
  getSupplierByCode: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const supplier = await supplierService.getSupplierByCode(
        companyId,
        code
      );

      return res.status(200).json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-supplier-by-code-controller",
      });

      if ((error as Error).message === "Supplier not found") {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch supplier",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/suppliers/search
   * Search suppliers
   */
  searchSuppliers: async (req: Request, res: Response) => {
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
          message: "Search query is required",
        });
      }

      const suppliers = await supplierService.searchSuppliers(
        companyId,
        q
      );

      return res.status(200).json({
        success: true,
        data: suppliers,
        count: suppliers.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "search-suppliers-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to search suppliers",
        error: (error as Error).message,
      });
    }
  },

  /**
   * POST /api/v1/suppliers
   * Create a new supplier
   */
  createSupplier: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      // Validate request body
      const validationResult = supplierSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const supplier = await supplierService.createSupplier(
        companyId,
        validationResult.data
      );

      return res.status(201).json({
        success: true,
        message: "Supplier created successfully",
        data: supplier,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-supplier-controller",
      });

      if (
        (error as Error).message === "Supplier code already exists" ||
        (error as Error).message === "Email already exists"
      ) {
        return res.status(409).json({
          success: false,
          message: (error as Error).message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create supplier",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PUT /api/v1/suppliers/:id
   * Update a supplier
   */
  updateSupplier: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      // Validate request body (partial update, so make all fields optional)
      const validationResult = supplierSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const supplier = await supplierService.updateSupplier(
        companyId,
        id,
        validationResult.data
      );

      return res.status(200).json({
        success: true,
        message: "Supplier updated successfully",
        data: supplier,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-supplier-controller",
      });

      if ((error as Error).message === "Supplier not found") {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      if (
        (error as Error).message === "Supplier code already exists" ||
        (error as Error).message === "Email already exists"
      ) {
        return res.status(409).json({
          success: false,
          message: (error as Error).message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update supplier",
        error: (error as Error).message,
      });
    }
  },

  /**
   * DELETE /api/v1/suppliers/:id
   * Delete (deactivate) a supplier
   */
  deleteSupplier: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const supplier = await supplierService.deleteSupplier(companyId, id);

      return res.status(200).json({
        success: true,
        message: "Supplier deleted successfully",
        data: supplier,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-supplier-controller",
      });

      if ((error as Error).message === "Supplier not found") {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to delete supplier",
        error: (error as Error).message,
      });
    }
  },
};

export default supplierController;
