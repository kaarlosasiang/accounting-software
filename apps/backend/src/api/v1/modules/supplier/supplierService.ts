import { Types } from "mongoose";
import { Supplier } from "../../models/Supplier.js";
import { ISupplierModel } from "../../shared/interface/ISupplier.js";
import logger from "../../config/logger.js";

// Type assertion to ensure static methods are recognized
const SupplierModel = Supplier as ISupplierModel;

/**
 * Supplier Service
 * Handles all supplier-related business logic
 */
const supplierService = {
  /**
   * Get all suppliers for a company
   */
  getAllSuppliers: async (companyId: string | Types.ObjectId) => {
    try {
      const suppliers = await Supplier.find({ companyId }).sort({
        supplierName: 1,
      });
      return suppliers;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-suppliers",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get active suppliers
   */
  getActiveSuppliers: async (companyId: string | Types.ObjectId) => {
    try {
      const suppliers = await SupplierModel.findActive(
        new Types.ObjectId(companyId),
      );
      return suppliers;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-active-suppliers",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get single supplier by ID
   */
  getSupplierById: async (
    companyId: string | Types.ObjectId,
    supplierId: string | Types.ObjectId,
  ) => {
    try {
      const supplier = await Supplier.findOne({
        _id: supplierId,
        companyId,
      });

      if (!supplier) {
        throw new Error("Supplier not found");
      }
      return supplier;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-supplier-by-id",
        companyId: companyId.toString(),
        supplierId: supplierId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get supplier by supplier code
   */
  getSupplierByCode: async (
    companyId: string | Types.ObjectId,
    supplierCode: string,
  ) => {
    try {
      const supplier = await SupplierModel.findBySupplierCode(
        new Types.ObjectId(companyId),
        supplierCode,
      );
      if (!supplier) {
        throw new Error("Supplier not found");
      }
      return supplier;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-supplier-by-code",
        companyId: companyId.toString(),
        supplierCode,
      });
      throw error;
    }
  },

  /**
   * Search suppliers
   */
  searchSuppliers: async (
    companyId: string | Types.ObjectId,
    searchTerm: string,
  ) => {
    try {
      const suppliers = await SupplierModel.searchSuppliers(
        new Types.ObjectId(companyId),
        searchTerm,
      );
      return suppliers;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "search-suppliers",
        companyId: companyId.toString(),
        searchTerm,
      });
      throw error;
    }
  },

  /**
   * Create a new supplier
   */
  createSupplier: async (
    companyId: string | Types.ObjectId,
    supplierData: {
      supplierCode?: string;
      supplierName: string;
      displayName?: string;
      email: string;
      phone: string;
      website?: string;
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      taxId: string;
      paymentTerms: string;
      openingBalance?: number;
      isActive?: boolean;
      notes?: string;
    },
  ) => {
    try {
      // Auto-generate supplier code if not provided
      let supplierCode = supplierData.supplierCode;
      if (!supplierCode) {
        const lastSupplier = await Supplier.findOne({
          companyId: new Types.ObjectId(companyId),
        })
          .sort({ createdAt: -1 })
          .limit(1);

        if (lastSupplier && lastSupplier.supplierCode) {
          const match = lastSupplier.supplierCode.match(/\d+$/);
          const lastNumber = match ? parseInt(match[0]) : 0;
          const nextNumber = lastNumber + 1;
          supplierCode = `SUP-${String(nextNumber).padStart(3, "0")}`;
        } else {
          supplierCode = "SUP-001";
        }
      }

      // Check if supplier code already exists
      const existingSupplier = await SupplierModel.findBySupplierCode(
        new Types.ObjectId(companyId),
        supplierCode,
      );

      if (existingSupplier) {
        throw new Error("Supplier code already exists");
      }

      // Check if email already exists
      const existingEmail = await Supplier.findOne({
        companyId,
        email: supplierData.email.toLowerCase(),
      });

      if (existingEmail) {
        throw new Error("Email already exists");
      }

      const supplier = new Supplier({
        companyId: new Types.ObjectId(companyId),
        ...supplierData,
        supplierCode,
        email: supplierData.email.toLowerCase(),
        currentBalance: supplierData.openingBalance || 0,
      });

      await supplier.save();
      return supplier;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-supplier",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Update a supplier
   */
  updateSupplier: async (
    companyId: string | Types.ObjectId,
    supplierId: string | Types.ObjectId,
    updateData: Partial<{
      supplierCode: string;
      supplierName: string;
      displayName: string;
      email: string;
      phone: string;
      website: string;
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      taxId: string;
      paymentTerms: string;
      openingBalance: number;
      isActive: boolean;
      notes: string;
    }>,
  ) => {
    try {
      const supplier = await Supplier.findOne({
        _id: supplierId,
        companyId,
      });

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      // Check if supplier code is being updated and if it already exists
      if (
        updateData.supplierCode &&
        updateData.supplierCode !== supplier.supplierCode
      ) {
        const existingSupplier = await SupplierModel.findBySupplierCode(
          new Types.ObjectId(companyId),
          updateData.supplierCode,
        );

        if (existingSupplier) {
          throw new Error("Supplier code already exists");
        }
      }

      // Check if email is being updated and if it already exists
      if (
        updateData.email &&
        updateData.email.toLowerCase() !== supplier.email
      ) {
        const existingEmail = await Supplier.findOne({
          companyId,
          email: updateData.email.toLowerCase(),
          _id: { $ne: supplierId },
        });

        if (existingEmail) {
          throw new Error("Email already exists");
        }
        updateData.email = updateData.email.toLowerCase();
      }

      Object.assign(supplier, updateData);
      await supplier.save();
      return supplier;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-supplier",
        companyId: companyId.toString(),
        supplierId: supplierId.toString(),
      });
      throw error;
    }
  },

  /**
   * Delete (deactivate) a supplier
   */
  deleteSupplier: async (
    companyId: string | Types.ObjectId,
    supplierId: string | Types.ObjectId,
  ) => {
    try {
      const supplier = await Supplier.findOne({
        _id: supplierId,
        companyId,
      });

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      supplier.isActive = false;
      await supplier.save();
      return supplier;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-supplier",
        companyId: companyId.toString(),
        supplierId: supplierId.toString(),
      });
      throw error;
    }
  },
};

export default supplierService;
