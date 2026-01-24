import { Request, Response } from "express";
import { invoiceService } from "./invoiceService.js";
import logger from "../../config/logger.js";
import { getCompanyId, getUserId } from "../../shared/helpers/utils.js";

/**
 * Invoice Controller
 * Handles HTTP requests for invoice operations
 */
export const invoiceController = {
  /**
   * Get all invoices
   * GET /api/v1/invoices
   */
  async getAllInvoices(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const invoices = await invoiceService.getAllInvoices(companyId);

      return res.status(200).json({
        success: true,
        data: invoices,
        count: invoices.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getAllInvoices" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Get invoice by ID
   * GET /api/v1/invoices/:id
   */
  async getInvoiceById(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const invoice = await invoiceService.getInvoiceById(companyId, id);

      return res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getInvoiceById" });
      return res
        .status(
          error instanceof Error && error.message === "Invoice not found"
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
   * Create new invoice
   * POST /api/v1/invoices
   */
  async createInvoice(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const userId = getUserId(req);

      if (!companyId || !userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - User information not found",
        });
      }

      const invoice = await invoiceService.createInvoice(
        companyId,
        userId,
        req.body,
      );

      return res.status(201).json({
        success: true,
        data: invoice,
        message: "Invoice created successfully",
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "createInvoice" });
      return res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create invoice",
      });
    }
  },

  /**
   * Update invoice
   * PUT /api/v1/invoices/:id
   */
  async updateInvoice(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const invoice = await invoiceService.updateInvoice(
        companyId,
        id,
        req.body,
      );

      return res.status(200).json({
        success: true,
        data: invoice,
        message: "Invoice updated successfully",
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "updateInvoice" });
      return res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update invoice",
      });
    }
  },

  /**
   * Delete invoice
   * DELETE /api/v1/invoices/:id
   */
  async deleteInvoice(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const result = await invoiceService.deleteInvoice(companyId, id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "deleteInvoice" });
      return res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete invoice",
      });
    }
  },

  /**
   * Void invoice
   * POST /api/v1/invoices/:id/void
   */
  async voidInvoice(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const invoice = await invoiceService.voidInvoice(companyId, id);

      return res.status(200).json({
        success: true,
        data: invoice,
        message: "Invoice voided successfully",
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "voidInvoice" });
      return res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to void invoice",
      });
    }
  },

  /**
   * Get invoices by customer
   * GET /api/v1/invoices/customer/:customerId
   */
  async getInvoicesByCustomer(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { customerId } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const invoices = await invoiceService.getInvoicesByCustomer(
        companyId,
        customerId,
      );

      return res.status(200).json({
        success: true,
        data: invoices,
        count: invoices.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getInvoicesByCustomer" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Get invoices by status
   * GET /api/v1/invoices/status/:status
   */
  async getInvoicesByStatus(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { status } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const invoices = await invoiceService.getInvoicesByStatus(
        companyId,
        status as any,
      );

      return res.status(200).json({
        success: true,
        data: invoices,
        count: invoices.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getInvoicesByStatus" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Get overdue invoices
   * GET /api/v1/invoices/overdue
   */
  async getOverdueInvoices(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      const invoices = await invoiceService.getOverdueInvoices(companyId);

      return res.status(200).json({
        success: true,
        data: invoices,
        count: invoices.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getOverdueInvoices" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Search invoices
   * GET /api/v1/invoices/search?q=searchTerm
   */
  async searchInvoices(req: Request, res: Response) {
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
          error: "Search term is required",
        });
      }

      const invoices = await invoiceService.searchInvoices(companyId, q);

      return res.status(200).json({
        success: true,
        data: invoices,
        count: invoices.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "searchInvoices" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * Send invoice to customer
   * POST /api/v1/invoices/:id/send
   */
  async sendInvoice(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;
      const { companyName } = req.body;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Company ID not found",
        });
      }

      if (!companyName) {
        return res.status(400).json({
          success: false,
          error: "Company name is required",
        });
      }

      const invoice = await invoiceService.sendInvoice(
        companyId,
        id,
        companyName,
      );

      return res.status(200).json({
        success: true,
        data: invoice,
        message: "Invoice sent successfully",
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "sendInvoice" });
      return res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send invoice",
      });
    }
  },
};
