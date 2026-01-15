import { Request, Response } from "express";
import { companySchema, companyUpdateSchema } from "@rrd10-sas/validators";
import companyService from "./companyService.js";
import logger from "../../config/logger.js";

/**
 * Company Controller
 * Handles HTTP requests for company operations
 */
const companyController = {
  /**
   * POST /api/v1/companies
   * Create a new company
   */
  createCompany: async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = companySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const {
        userId,
        companyName,
        companyId,
        industry,
        companySize,
        description,
        address,
        city,
        state,
        country,
        postalCode,
        taxId,
        registrationNumber,
        website,
        phone,
        email,
      } = validationResult.data;

      const result = await companyService.createCompany({
        userId,
        companyName,
        companyId,
        industry,
        companySize,
        description,
        address,
        city,
        state,
        country,
        postalCode,
        taxId,
        registrationNumber,
        website,
        phone,
        email,
      });

      return res.status(201).json({
        success: true,
        message: "Company created successfully",
        data: result,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-company-controller",
      });

      if ((error as Error).message === "Company ID already exists") {
        return res.status(409).json({
          success: false,
          message: "Company ID already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create company",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/companies/:companyId
   * Get company by companyId
   */
  getCompanyById: async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;

      const company = await companyService.getCompanyById(companyId);

      return res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-company-by-id-controller",
      });

      if ((error as Error).message === "Company not found") {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch company",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PUT /api/v1/companies/:companyId
   * Update company
   */
  updateCompany: async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const updateData = req.body;

      // Validate input
      const validationResult = companyUpdateSchema.safeParse(updateData);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      await companyService.updateCompany(companyId, validationResult.data);

      return res.status(200).json({
        success: true,
        message: "Company updated successfully",
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-company-controller",
      });

      if ((error as Error).message === "Company not found") {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update company",
        error: (error as Error).message,
      });
    }
  },
};

export default companyController;
