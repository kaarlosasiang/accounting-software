import mongoose from "mongoose";
import { Customer } from "../../models/Customer.js";
import logger from "../../config/logger.js";

/**
 * Customer Input type (inferred from validator)
 */
type CustomerInput = {
  customerCode?: string;
  customerName: string;
  displayName?: string;
  email: string;
  phone: string;
  website?: string | null;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  taxId: string;
  paymentTerms: string;
  creditLimit?: number;
  openingBalance?: number;
  notes?: string | null;
};

type CustomerUpdateInput = Partial<CustomerInput>;

/**
 * Customer Service
 * Handles all customer-related business logic
 */
const customerService = {
  /**
   * Get all customers for a company
   */
  getAllCustomers: async (companyId: string) => {
    try {
      const customers = await Customer.find({
        companyId: new mongoose.Types.ObjectId(companyId),
      }).sort({ customerName: 1 });

      return customers;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-customers-service",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Get active customers
   */
  getActiveCustomers: async (companyId: string) => {
    try {
      const customers = await Customer.findActive(
        new mongoose.Types.ObjectId(companyId),
      );

      return customers;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-active-customers-service",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Get customer by ID
   */
  getCustomerById: async (companyId: string, customerId: string) => {
    try {
      const customer = await Customer.findOne({
        _id: new mongoose.Types.ObjectId(customerId),
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      return customer;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-customer-by-id-service",
        companyId,
        customerId,
      });
      throw error;
    }
  },

  /**
   * Get customer by customer code
   */
  getCustomerByCode: async (companyId: string, customerCode: string) => {
    try {
      const customer = await Customer.findByCustomerCode(
        new mongoose.Types.ObjectId(companyId),
        customerCode,
      );

      if (!customer) {
        throw new Error("Customer not found");
      }

      return customer;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-customer-by-code-service",
        companyId,
        customerCode,
      });
      throw error;
    }
  },

  /**
   * Create a new customer
   */
  createCustomer: async (companyId: string, customerData: CustomerInput) => {
    try {
      const normalizedEmail = customerData.email.trim().toLowerCase();
      const normalizedTaxId = customerData.taxId.trim();

      const duplicateCustomer = await Customer.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        $or: [{ email: normalizedEmail }, { taxId: normalizedTaxId }],
      });

      if (duplicateCustomer) {
        if (duplicateCustomer.email === normalizedEmail) {
          throw new Error("Customer email already exists");
        }

        if (duplicateCustomer.taxId === normalizedTaxId) {
          throw new Error("Customer tax ID already exists");
        }
      }

      // Auto-generate customer code if not provided
      let customerCode = customerData.customerCode;
      if (!customerCode) {
        const lastCustomer = await Customer.findOne({
          companyId: new mongoose.Types.ObjectId(companyId),
        })
          .sort({ createdAt: -1 })
          .limit(1);

        if (lastCustomer && lastCustomer.customerCode) {
          // Extract number from last code (e.g., "CUST-001" -> 1)
          const match = lastCustomer.customerCode.match(/\d+$/);
          const lastNumber = match ? parseInt(match[0]) : 0;
          const nextNumber = lastNumber + 1;
          customerCode = `CUST-${String(nextNumber).padStart(3, "0")}`;
        } else {
          customerCode = "CUST-001";
        }
      }

      // Check if customer code already exists
      const existingCustomer = await Customer.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        customerCode,
      });

      if (existingCustomer) {
        throw new Error("Customer code already exists");
      }

      // Auto-generate display name if not provided
      const displayName = customerData.displayName || customerData.customerName;

      const customer = new Customer({
        ...customerData,
        email: normalizedEmail,
        taxId: normalizedTaxId,
        customerCode,
        displayName,
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      await customer.save();

      logger.info("Customer created successfully", {
        companyId,
        customerId: customer._id,
        customerCode: customer.customerCode,
      });

      return customer;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-customer-service",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Update a customer
   */
  updateCustomer: async (
    companyId: string,
    customerId: string,
    updateData: CustomerUpdateInput,
  ) => {
    try {
      if (updateData.email || updateData.taxId) {
        const email = updateData.email?.trim().toLowerCase();
        const taxId = updateData.taxId?.trim();

        const duplicateConditions: Array<Record<string, string>> = [];
        if (email) {
          duplicateConditions.push({ email });
        }
        if (taxId) {
          duplicateConditions.push({ taxId });
        }

        if (duplicateConditions.length > 0) {
          const duplicateCustomer = await Customer.findOne({
            companyId: new mongoose.Types.ObjectId(companyId),
            _id: { $ne: new mongoose.Types.ObjectId(customerId) },
            $or: duplicateConditions,
          });

          if (duplicateCustomer) {
            if (email && duplicateCustomer.email === email) {
              throw new Error("Customer email already exists");
            }

            if (taxId && duplicateCustomer.taxId === taxId) {
              throw new Error("Customer tax ID already exists");
            }
          }

          if (email) {
            updateData.email = email;
          }
          if (taxId) {
            updateData.taxId = taxId;
          }
        }
      }

      // Check if customer code is being updated and already exists
      if (updateData.customerCode) {
        const existingCustomer = await Customer.findOne({
          companyId: new mongoose.Types.ObjectId(companyId),
          customerCode: updateData.customerCode,
          _id: { $ne: new mongoose.Types.ObjectId(customerId) },
        });

        if (existingCustomer) {
          throw new Error("Customer code already exists");
        }
      }

      const customer = await Customer.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(customerId),
          companyId: new mongoose.Types.ObjectId(companyId),
        },
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (!customer) {
        throw new Error("Customer not found");
      }

      logger.info("Customer updated successfully", {
        companyId,
        customerId,
      });

      return customer;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-customer-service",
        companyId,
        customerId,
      });
      throw error;
    }
  },

  /**
   * Delete a customer
   */
  deleteCustomer: async (companyId: string, customerId: string) => {
    try {
      const customer = await Customer.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(customerId),
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      logger.info("Customer deleted successfully", {
        companyId,
        customerId,
      });

      return customer;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-customer-service",
        companyId,
        customerId,
      });
      throw error;
    }
  },

  /**
   * Toggle customer active status
   */
  toggleCustomerStatus: async (companyId: string, customerId: string) => {
    try {
      const customer = await Customer.findOne({
        _id: new mongoose.Types.ObjectId(customerId),
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      customer.isActive = !customer.isActive;
      await customer.save();

      logger.info("Customer status toggled successfully", {
        companyId,
        customerId,
        isActive: customer.isActive,
      });

      return customer;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "toggle-customer-status-service",
        companyId,
        customerId,
      });
      throw error;
    }
  },

  /**
   * Search customers
   */
  searchCustomers: async (companyId: string, searchTerm: string) => {
    try {
      const customers = await Customer.searchCustomers(
        new mongoose.Types.ObjectId(companyId),
        searchTerm,
      );

      return customers;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "search-customers-service",
        companyId,
        searchTerm,
      });
      throw error;
    }
  },

  /**
   * Update customer balance
   */
  updateCustomerBalance: async (
    companyId: string,
    customerId: string,
    amount: number,
  ) => {
    try {
      const customer = await Customer.findOne({
        _id: new mongoose.Types.ObjectId(customerId),
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      await customer.updateBalance(amount);

      logger.info("Customer balance updated successfully", {
        companyId,
        customerId,
        amount,
        newBalance: customer.currentBalance,
      });

      return customer;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-customer-balance-service",
        companyId,
        customerId,
      });
      throw error;
    }
  },

  /**
   * Check credit availability
   */
  checkCreditAvailability: async (
    companyId: string,
    customerId: string,
    amount: number,
  ) => {
    try {
      const customer = await Customer.findOne({
        _id: new mongoose.Types.ObjectId(customerId),
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      const hasCredit = customer.hasCreditAvailable(amount);

      return {
        hasCredit,
        creditLimit: customer.creditLimit,
        currentBalance: customer.currentBalance,
        availableCredit: customer.availableCredit,
        requestedAmount: amount,
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "check-credit-availability-service",
        companyId,
        customerId,
      });
      throw error;
    }
  },
};

export default customerService;
