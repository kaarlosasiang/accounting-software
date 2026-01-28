import mongoose from "mongoose";
import { CompanySettings } from "../models/CompanySettings.js";
import logger from "../config/logger.js";

/**
 * Document Number Generator Utility
 * Handles generation of unique document numbers (Invoice, Bill, Payment, etc.)
 * with company-scoped sequences and format configuration
 */

export interface DocumentNumberConfig {
  companyId: string;
  documentType: "INVOICE" | "BILL" | "PAYMENT";
  session?: mongoose.ClientSession;
}

/**
 * Generate the next sequential number for a document type within a company
 * @param config Configuration object with companyId and documentType
 * @returns Generated document number (e.g., "INV-2025-001")
 */
export async function generateDocumentNumber(
  config: DocumentNumberConfig,
): Promise<string> {
  const { companyId, documentType, session } = config;

  try {
    // Get company settings to get prefix and start number
    const settings = await CompanySettings.findOne({ companyId }).session(session);

    if (!settings) {
      throw new Error("Company settings not found");
    }

    let prefix = "DOC";
    let settingField = "invoiceStartNumber"; // default field to increment

    if (documentType === "INVOICE") {
      prefix = settings.invoicingSettings?.invoicePrefix || "INV";
      settingField = "invoiceStartNumber";
    } else if (documentType === "BILL") {
      prefix = settings.billingSettings?.billPrefix || "BILL";
      settingField = "billStartNumber";
    } else if (documentType === "PAYMENT") {
      prefix = "PAY"; // Can be made configurable in future
      settingField = "paymentStartNumber";
    }

    // Get the current year for the number
    const currentYear = new Date().getFullYear();

    // Update company settings and get the incremented number
    // Using findOneAndUpdate to ensure atomicity across concurrent requests
    const updatedSettings = await CompanySettings.findOneAndUpdate(
      { companyId },
      { $inc: { [`${getSettingsPath(documentType)}.nextSequenceNumber`]: 1 } },
      { new: true, session },
    );

    if (!updatedSettings) {
      throw new Error("Failed to increment document sequence number");
    }

    const sequenceNumber = getNextSequence(updatedSettings, documentType);

    // Format: PREFIX-YEAR-SEQUENCE (e.g., INV-2025-001)
    const documentNumber = `${prefix}-${currentYear}-${String(sequenceNumber).padStart(4, "0")}`;

    return documentNumber;
  } catch (error) {
    logger.logError(error as Error, {
      operation: "generateDocumentNumber",
      companyId,
      documentType,
    });
    throw error;
  }
}

/**
 * Helper function to get the settings path based on document type
 */
function getSettingsPath(documentType: string): string {
  switch (documentType) {
    case "INVOICE":
      return "invoicingSettings";
    case "BILL":
      return "billingSettings";
    case "PAYMENT":
      return "paymentSettings";
    default:
      return "invoicingSettings";
  }
}

/**
 * Helper function to get next sequence number from settings
 */
function getNextSequence(settings: any, documentType: string): number {
  const settingsObj =
    documentType === "INVOICE"
      ? settings.invoicingSettings
      : documentType === "BILL"
        ? settings.billingSettings
        : settings.paymentSettings;

  return settingsObj?.nextSequenceNumber || 1;
}

/**
 * Initialize document number settings for a new company
 * Call this when creating a new company
 */
export async function initializeDocumentNumbers(
  companyId: string,
  session?: mongoose.ClientSession,
): Promise<void> {
  try {
    const settings = await CompanySettings.findOne({ companyId }).session(session);

    if (!settings) {
      throw new Error("Company settings not found");
    }

    // Initialize sequence numbers if not present
    if (!settings.invoicingSettings?.nextSequenceNumber) {
      settings.invoicingSettings = {
        ...settings.invoicingSettings,
        nextSequenceNumber: (settings.invoicingSettings?.invoiceStartNumber || 1),
      };
    }

    if (!settings.billingSettings?.nextSequenceNumber) {
      settings.billingSettings = {
        ...settings.billingSettings,
        nextSequenceNumber: (settings.billingSettings?.billStartNumber || 1),
      };
    }

    if (!settings.paymentSettings?.nextSequenceNumber) {
      settings.paymentSettings = {
        ...settings.paymentSettings,
        nextSequenceNumber: 1,
      };
    }

    await settings.save({ session });
  } catch (error) {
    logger.logError(error as Error, {
      operation: "initializeDocumentNumbers",
      companyId,
    });
    throw error;
  }
}
