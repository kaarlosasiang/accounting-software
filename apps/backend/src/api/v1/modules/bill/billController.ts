import { Request, Response } from "express";
import { billService } from "./billService.js";
import { paymentService } from "../payment/paymentService.js";
import logger from "../../config/logger.js";
import { getCompanyId, getUserId } from "../../shared/helpers/utils.js";
import { createBillSchema, updateBillSchema } from "@rrd10-sas/validators";

/**
 * Bill Controller
 * Handles HTTP requests for bill operations
 */
export const billController = {
  /**
   * Get all bills
   * GET /api/v1/bills
   */
  async getAllBills(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const bills = await billService.getAllBills(companyId);

      return res.status(200).json({
        success: true,
        data: bills,
        count: bills.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getAllBills" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Get bill by ID
   * GET /api/v1/bills/:id
   */
  async getBillById(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const bill = await billService.getBillById(companyId, id);

      return res.status(200).json({
        success: true,
        data: bill,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getBillById" });
      return res
        .status(
          error instanceof Error && error.message === "Bill not found"
            ? 404
            : 500,
        )
        .json({
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        });
    }
  },

  /**
   * Create new bill
   * POST /api/v1/bills
   */
  async createBill(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const userId = getUserId(req);

      if (!companyId || !userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - User information not found",
        });
      }

      // Validate request data
      const validationResult = createBillSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        });
      }

      const bill = await billService.createBill(companyId, userId, req.body);

      return res.status(201).json({
        success: true,
        message: "Bill created successfully",
        data: bill,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "createBill" });
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create bill",
      });
    }
  },

  /**
   * Update bill
   * PUT /api/v1/bills/:id
   */
  async updateBill(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      // Validate request data
      const validationResult = updateBillSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        });
      }

      const bill = await billService.updateBill(companyId, id, req.body);

      return res.status(200).json({
        success: true,
        message: "Bill updated successfully",
        data: bill,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "updateBill" });
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to update bill",
      });
    }
  },

  /**
   * Delete bill
   * DELETE /api/v1/bills/:id
   */
  async deleteBill(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const result = await billService.deleteBill(companyId, id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "deleteBill" });
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete bill",
      });
    }
  },

  /**
   * Void bill
   * POST /api/v1/bills/:id/void
   */
  async voidBill(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const bill = await billService.voidBill(companyId, id);

      return res.status(200).json({
        success: true,
        message: "Bill voided successfully",
        data: bill,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "voidBill" });
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to void bill",
      });
    }
  },

  /**
   * Get bills by supplier
   * GET /api/v1/bills/supplier/:supplierId
   */
  async getBillsBySupplier(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { supplierId } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const bills = await billService.getBillsBySupplier(companyId, supplierId);

      return res.status(200).json({
        success: true,
        data: bills,
        count: bills.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getBillsBySupplier" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Get bills by status
   * GET /api/v1/bills/status/:status
   */
  async getBillsByStatus(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { status } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const bills = await billService.getBillsByStatus(
        companyId,
        status as any,
      );

      return res.status(200).json({
        success: true,
        data: bills,
        count: bills.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getBillsByStatus" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Get overdue bills
   * GET /api/v1/bills/overdue
   */
  async getOverdueBills(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const bills = await billService.getOverdueBills(companyId);

      return res.status(200).json({
        success: true,
        data: bills,
        count: bills.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getOverdueBills" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Search bills
   * GET /api/v1/bills/search?q=searchTerm
   */
  async searchBills(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { q } = req.query;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          error: "Search query parameter 'q' is required",
        });
      }

      const bills = await billService.searchBills(companyId, q);

      return res.status(200).json({
        success: true,
        data: bills,
        count: bills.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "searchBills" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Record payment for a bill
   * POST /api/v1/bills/:id/payments
   */
  async recordPayment(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const userId = getUserId(req);
      const { id } = req.params;

      if (!companyId || !userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID or User ID not found",
        });
      }

      const paymentData = {
        ...req.body,
        billId: id,
        companyId,
      };

      const result = await paymentService.recordPaymentMade(
        companyId,
        userId,
        paymentData,
      );

      return res.status(201).json({
        success: true,
        data: result,
        message: "Payment recorded successfully",
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "recordPayment" });
      return res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to record payment",
      });
    }
  },

  /**
   * Approve bill
   * POST /api/v1/bills/:id/approve
   */
  async approveBill(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const bill = await billService.approveBill(companyId, id);

      return res.status(200).json({
        success: true,
        data: bill,
        message: "Bill approved successfully",
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "approveBill" });
      return res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to approve bill",
      });
    }
  },

  /**
   * Get payment history for a bill
   * GET /api/v1/bills/:id/payments
   */
  async getBillPayments(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const payments = await billService.getBillPayments(companyId, id);

      return res.status(200).json({
        success: true,
        data: payments,
        count: payments.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getBillPayments" });
      return res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get payments",
      });
    }
  },
};
