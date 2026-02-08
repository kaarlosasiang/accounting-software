import { Request, Response } from "express";
import { customerSchema } from "@rrd10-sas/validators";
import customerService from "./customerService.js";
import logger from "../../config/logger.js";
import { getCompanyId } from "../../shared/helpers/utils.js";

/**
 * Customer Controller
 * Handles HTTP requests for customer operations
 */
const customerController = {
  /**
   * GET /api/v1/customers
   * Get all customers for the company
   */
  getAllCustomers: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      logger.debug("Fetched companyId for customers", { companyId });
      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      const customers = await customerService.getAllCustomers(companyId);

      return res.status(200).json({
        success: true,
        data: customers,
        count: customers.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-customers-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch customers",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/customers/active
   * Get active customers
   */
  getActiveCustomers: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      const customers = await customerService.getActiveCustomers(companyId);

      return res.status(200).json({
        success: true,
        data: customers,
        count: customers.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-active-customers-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch active customers",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/customers/search
   * Search customers
   */
  searchCustomers: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const { q } = req.query;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const customers = await customerService.searchCustomers(companyId, q);

      return res.status(200).json({
        success: true,
        data: customers,
        count: customers.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "search-customers-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to search customers",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/customers/:id
   * Get a single customer
   */
  getCustomerById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      const customer = await customerService.getCustomerById(companyId, id);

      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-customer-by-id-controller",
      });

      if ((error as Error).message === "Customer not found") {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch customer",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/customers/code/:code
   * Get customer by customer code
   */
  getCustomerByCode: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      const customer = await customerService.getCustomerByCode(companyId, code);

      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-customer-by-code-controller",
      });

      if ((error as Error).message === "Customer not found") {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch customer",
        error: (error as Error).message,
      });
    }
  },

  /**
   * POST /api/v1/customers
   * Create a new customer
   */
  createCustomer: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      // Validate request body
      const validationResult = customerSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const customer = await customerService.createCustomer(
        companyId,
        validationResult.data,
      );

      return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-customer-controller",
      });

      if ((error as Error).message === "Customer code already exists") {
        return res.status(409).json({
          success: false,
          message: "Customer code already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create customer",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PUT /api/v1/customers/:id
   * Update a customer
   */
  updateCustomer: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      // Validate request body
      const validationResult = customerSchema.partial().safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const customer = await customerService.updateCustomer(
        companyId,
        id,
        validationResult.data,
      );

      return res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-customer-controller",
      });

      if ((error as Error).message === "Customer not found") {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      if ((error as Error).message === "Customer code already exists") {
        return res.status(409).json({
          success: false,
          message: "Customer code already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update customer",
        error: (error as Error).message,
      });
    }
  },

  /**
   * DELETE /api/v1/customers/:id
   * Delete a customer
   */
  deleteCustomer: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      await customerService.deleteCustomer(companyId, id);

      return res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-customer-controller",
      });

      if ((error as Error).message === "Customer not found") {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to delete customer",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PATCH /api/v1/customers/:id/toggle-status
   * Toggle customer active status
   */
  toggleCustomerStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      const customer = await customerService.toggleCustomerStatus(
        companyId,
        id,
      );

      return res.status(200).json({
        success: true,
        message: `Customer ${
          customer.isActive ? "activated" : "deactivated"
        } successfully`,
        data: customer,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "toggle-customer-status-controller",
      });

      if ((error as Error).message === "Customer not found") {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to toggle customer status",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PATCH /api/v1/customers/:id/balance
   * Update customer balance
   */
  updateCustomerBalance: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      if (typeof amount !== "number") {
        return res.status(400).json({
          success: false,
          message: "Amount must be a number",
        });
      }

      const customer = await customerService.updateCustomerBalance(
        companyId,
        id,
        amount,
      );

      return res.status(200).json({
        success: true,
        message: "Customer balance updated successfully",
        data: customer,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-customer-balance-controller",
      });

      if ((error as Error).message === "Customer not found") {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update customer balance",
        error: (error as Error).message,
      });
    }
  },

  /**
   * POST /api/v1/customers/:id/check-credit
   * Check credit availability
   */
  checkCreditAvailability: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Company ID is required",
        });
      }

      if (typeof amount !== "number") {
        return res.status(400).json({
          success: false,
          message: "Amount must be a number",
        });
      }

      const result = await customerService.checkCreditAvailability(
        companyId,
        id,
        amount,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "check-credit-availability-controller",
      });

      if ((error as Error).message === "Customer not found") {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to check credit availability",
        error: (error as Error).message,
      });
    }
  },
};

export default customerController;
