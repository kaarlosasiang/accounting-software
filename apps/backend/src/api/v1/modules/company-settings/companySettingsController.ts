import { Request, Response } from "express";
import companySettingsService from "./companySettingsService.js";
import logger from "../../config/logger.js";
import { getCompanyId } from "../../shared/helpers/utils.js";

/**
 * Company Settings Controller
 * Handles HTTP requests for company settings operations
 */

const companySettingsController = {
  /**
   * GET /api/v1/company-settings
   * Get company settings
   */
  getCompanySettings: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const settings =
        await companySettingsService.getCompanySettings(companyId);

      return res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-company-settings-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch company settings",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PUT /api/v1/company-settings/general
   * Update general settings
   */
  updateGeneralSettings: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const settings = await companySettingsService.updateGeneralSettings(
        companyId,
        req.body,
      );

      return res.status(200).json({
        success: true,
        message: "General settings updated successfully",
        data: settings,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-general-settings-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to update general settings",
        error: (error as Error).message,
      });
    }
  },

  /**
   * POST /api/v1/company-settings/banking/accounts
   * Add bank account
   */
  addBankAccount: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const settings = await companySettingsService.addBankAccount(
        companyId,
        req.body,
      );

      return res.status(201).json({
        success: true,
        message: "Bank account added successfully",
        data: settings,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "add-bank-account-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to add bank account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PUT /api/v1/company-settings/banking/accounts/:id
   * Update bank account
   */
  updateBankAccount: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const { id: bankAccountId } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!bankAccountId) {
        return res.status(400).json({
          success: false,
          message: "Bank account ID is required",
        });
      }

      const settings = await companySettingsService.updateBankAccount(
        companyId,
        bankAccountId,
        req.body,
      );

      return res.status(200).json({
        success: true,
        message: "Bank account updated successfully",
        data: settings,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-bank-account-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to update bank account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * DELETE /api/v1/company-settings/banking/accounts/:id
   * Remove bank account
   */
  removeBankAccount: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const { id: bankAccountId } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!bankAccountId) {
        return res.status(400).json({
          success: false,
          message: "Bank account ID is required",
        });
      }

      const settings = await companySettingsService.removeBankAccount(
        companyId,
        bankAccountId,
      );

      return res.status(200).json({
        success: true,
        message: "Bank account removed successfully",
        data: settings,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "remove-bank-account-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to remove bank account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/company-settings/banking/accounts/:id
   * Get specific bank account
   */
  getBankAccount: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const { id: bankAccountId } = req.params;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!bankAccountId) {
        return res.status(400).json({
          success: false,
          message: "Bank account ID is required",
        });
      }

      const bankAccount = await companySettingsService.getBankAccount(
        companyId,
        bankAccountId,
      );

      return res.status(200).json({
        success: true,
        data: bankAccount,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-bank-account-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch bank account",
        error: (error as Error).message,
      });
    }
  },
};

export default companySettingsController;
