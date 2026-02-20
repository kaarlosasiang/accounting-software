import mongoose from "mongoose";
import { Invoice } from "../../models/Invoice.js";
import { Customer } from "../../models/Customer.js";
import { InventoryItem } from "../../models/InventoryItem.js";
import { InventoryTransaction } from "../../models/InventoryTransaction.js";
import { CompanySettings } from "../../models/CompanySettings.js";
import {
  InvoiceStatus,
  IInvoiceDocument,
} from "../../shared/interface/IInvoice.js";
import logger from "../../config/logger.js";
import { EmailService } from "../../services/email.service.js";
import { PDFService } from "../../services/pdf.service.js";
// import { generateDocumentNumber } from "../../utils/documentNumberGenerator.js";
import { JournalEntryService } from "../../services/journalEntryService.js";

/**
 * Invoice Service
 * Handles all business logic for invoices
 */
export const invoiceService = {
  /**
   * Get all invoices for a company
   */
  async getAllInvoices(companyId: string) {
    try {
      const invoices = await Invoice.find({ companyId })
        .populate("customerId", "customerName displayName email")
        .populate("createdBy", "first_name last_name email")
        .sort({ invoiceDate: -1 });

      return invoices;
    } catch (error) {
      logger.logError(error as Error, { operation: "getAllInvoices" });
      throw error;
    }
  },

  /**
   * Get invoice by ID
   */
  async getInvoiceById(companyId: string, invoiceId: string) {
    try {
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        companyId,
      })
        .populate(
          "customerId",
          "customerName displayName email phone billingAddress currentBalance",
        )
        .populate("lineItems.accountId", "accountCode accountName")
        .populate("lineItems.inventoryItemId", "sku itemName unit")
        .populate("createdBy", "first_name last_name email");

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      return invoice;
    } catch (error) {
      logger.logError(error as Error, { operation: "getInvoiceById" });
      throw error;
    }
  },

  /**
   * Create new invoice
   */
  async createInvoice(companyId: string, userId: string, invoiceData: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate customer exists
      const customer = await Customer.findOne({
        _id: invoiceData.customerId,
        companyId,
      }).session(session);

      if (!customer) {
        throw new Error("Customer not found");
      }

      // Generate invoice number
      // Format: INV-2025-0001 (company-scoped, with year)
      const year = new Date().getFullYear();
      const count = await Invoice.countDocuments({
        companyId,
        invoiceDate: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      });
      const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

      // Create invoice
      const invoice = new Invoice({
        ...invoiceData,
        companyId,
        invoiceNumber,
        createdBy: userId,
        status: InvoiceStatus.DRAFT,
      });

      await invoice.save({ session });

      // If status is not DRAFT, process inventory, update customer balance, and create journal entry
      if (invoiceData.status && invoiceData.status !== InvoiceStatus.DRAFT) {
        await this.processInvoiceItems(invoice, session);
        await this.updateCustomerBalance(
          customer,
          invoice.totalAmount,
          session,
        );

        // Create automatic journal entry
        const journalEntryId =
          await JournalEntryService.createInvoiceJournalEntry(
            invoice,
            new mongoose.Types.ObjectId(userId),
          );
        invoice.journalEntryId = journalEntryId;
        await invoice.save({ session });
      }

      await session.commitTransaction();

      // Populate and return the created invoice
      const populatedInvoice = await Invoice.findById(invoice._id)
        .populate("customerId", "customerName displayName email")
        .populate("createdBy", "first_name last_name email");

      return populatedInvoice;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, { operation: "createInvoice" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Update invoice
   */
  async updateInvoice(companyId: string, invoiceId: string, updateData: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        companyId,
      }).session(session);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Cannot update paid or void invoices
      if (
        invoice.status === InvoiceStatus.PAID ||
        invoice.status === InvoiceStatus.VOID
      ) {
        throw new Error(
          `Cannot update ${invoice.status.toLowerCase()} invoice`,
        );
      }

      const oldStatus = invoice.status;
      const oldTotal = invoice.totalAmount;

      // Update invoice fields
      Object.assign(invoice, updateData);
      await invoice.save({ session });

      // If status changed from DRAFT to active, process inventory and create journal entry
      if (
        oldStatus === InvoiceStatus.DRAFT &&
        invoice.status !== InvoiceStatus.DRAFT
      ) {
        await this.processInvoiceItems(invoice, session);
        const customer = await Customer.findById(invoice.customerId).session(
          session,
        );
        if (customer) {
          await this.updateCustomerBalance(
            customer,
            invoice.totalAmount,
            session,
          );
        }

        // Create automatic journal entry
        const journalEntryId =
          await JournalEntryService.createInvoiceJournalEntry(
            invoice,
            invoice.createdBy,
          );
        invoice.journalEntryId = journalEntryId;
        await invoice.save({ session });
      }

      // If total amount changed, update customer balance
      if (
        oldTotal !== invoice.totalAmount &&
        oldStatus !== InvoiceStatus.DRAFT
      ) {
        const customer = await Customer.findById(invoice.customerId).session(
          session,
        );
        if (customer) {
          const difference = invoice.totalAmount - oldTotal;
          await this.updateCustomerBalance(customer, difference, session);
        }
      }

      await session.commitTransaction();

      // Populate and return the updated invoice
      const populatedInvoice = await Invoice.findById(invoice._id)
        .populate("customerId", "customerName displayName email")
        .populate("createdBy", "first_name last_name email");

      return populatedInvoice;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, { operation: "updateInvoice" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Delete invoice (only DRAFT invoices)
   */
  async deleteInvoice(companyId: string, invoiceId: string) {
    try {
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        companyId,
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Only allow deletion of DRAFT invoices
      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new Error(
          "Only draft invoices can be deleted. Use void instead.",
        );
      }

      await invoice.deleteOne();
      return { message: "Invoice deleted successfully" };
    } catch (error) {
      logger.logError(error as Error, { operation: "deleteInvoice" });
      throw error;
    }
  },

  /**
   * Void invoice
   */
  async voidInvoice(companyId: string, invoiceId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoice = (await Invoice.findOne({
        _id: invoiceId,
        companyId,
      }).session(session)) as IInvoiceDocument | null;

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Use the model's void method
      await invoice.void();
      await invoice.save({ session });

      // Reverse customer balance
      const customer = await Customer.findById(invoice.customerId).session(
        session,
      );
      if (customer && invoice.status !== InvoiceStatus.DRAFT) {
        await this.updateCustomerBalance(
          customer,
          -invoice.balanceDue,
          session,
        );
      }

      // Reverse inventory transactions
      await this.reverseInvoiceItems(invoice, session);

      await session.commitTransaction();

      return invoice;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, { operation: "voidInvoice" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Get invoices by customer
   */
  async getInvoicesByCustomer(companyId: string, customerId: string) {
    try {
      const invoices = await Invoice.find({
        companyId,
        customerId,
      })
        .populate("createdBy", "first_name last_name email")
        .sort({ invoiceDate: -1 });

      return invoices;
    } catch (error) {
      logger.logError(error as Error, { operation: "getInvoicesByCustomer" });
      throw error;
    }
  },

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(companyId: string, status: InvoiceStatus) {
    try {
      const invoices = await Invoice.find({
        companyId,
        status,
      })
        .populate("customerId", "customerName displayName email")
        .populate("createdBy", "first_name last_name email")
        .sort({ invoiceDate: -1 });

      return invoices;
    } catch (error) {
      logger.logError(error as Error, { operation: "getInvoicesByStatus" });
      throw error;
    }
  },

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(companyId: string) {
    try {
      const invoices = await Invoice.find({
        companyId,
        status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL] },
        dueDate: { $lt: Date.now() },
      })
        .populate("customerId", "customerName displayName email")
        .populate("createdBy", "first_name last_name email")
        .sort({ dueDate: 1 });

      return invoices;
    } catch (error) {
      logger.logError(error as Error, { operation: "getOverdueInvoices" });
      throw error;
    }
  },

  /**
   * Search invoices
   */
  async searchInvoices(companyId: string, searchTerm: string) {
    try {
      // First, find matching customers
      const customers = await Customer.find({
        companyId,
        $or: [
          { customerName: { $regex: searchTerm, $options: "i" } },
          { displayName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
        ],
      }).select("_id");

      const customerIds = customers.map((c) => c._id);

      // Search invoices by invoice number or customer
      const invoices = await Invoice.find({
        companyId,
        $or: [
          { invoiceNumber: { $regex: searchTerm, $options: "i" } },
          { customerId: { $in: customerIds } },
        ],
      })
        .populate("customerId", "customerName displayName email")
        .populate("createdBy", "first_name last_name email")
        .sort({ invoiceDate: -1 });

      return invoices;
    } catch (error) {
      logger.logError(error as Error, { operation: "searchInvoices" });
      throw error;
    }
  },

  /**
   * Process invoice items (reduce inventory when invoice is confirmed)
   */
  async processInvoiceItems(invoice: any, session: any) {
    try {
      for (const lineItem of invoice.lineItems) {
        if (lineItem.inventoryItemId) {
          const inventoryItem = await InventoryItem.findById(
            lineItem.inventoryItemId,
          ).session(session);

          if (!inventoryItem) {
            throw new Error(
              `Inventory item not found: ${lineItem.inventoryItemId}`,
            );
          }

          // Check if enough stock is available
          if (inventoryItem.currentStock < lineItem.quantity) {
            throw new Error(
              `Insufficient stock for ${inventoryItem.itemName}. Available: ${inventoryItem.currentStock}, Required: ${lineItem.quantity}`,
            );
          }

          // Reduce inventory
          inventoryItem.currentStock -= lineItem.quantity;
          await inventoryItem.save({ session });

          // Create inventory transaction
          const transaction = new InventoryTransaction({
            companyId: invoice.companyId,
            inventoryItemId: lineItem.inventoryItemId,
            transactionType: "SALE",
            transactionDate: invoice.invoiceDate || new Date(),
            quantityIn: 0,
            quantityOut: lineItem.quantity,
            unitCost: lineItem.unitPrice,
            totalValue: lineItem.amount,
            balanceAfter: inventoryItem.currentStock,
            referenceType: "INVOICE",
            referenceId: invoice._id,
            notes: `Sale via Invoice ${invoice.invoiceNumber}`,
            createdBy: invoice.createdBy,
          });

          await transaction.save({ session });
        }
      }
    } catch (error) {
      logger.logError(error as Error, { operation: "processInvoiceItems" });
      throw error;
    }
  },

  /**
   * Reverse invoice items (when voiding invoice)
   */
  async reverseInvoiceItems(invoice: any, session: any) {
    try {
      for (const lineItem of invoice.lineItems) {
        if (lineItem.inventoryItemId) {
          const inventoryItem = await InventoryItem.findById(
            lineItem.inventoryItemId,
          ).session(session);

          if (inventoryItem) {
            // Restore inventory
            inventoryItem.currentStock += lineItem.quantity;
            await inventoryItem.save({ session });

            // Create reversal transaction
            const transaction = new InventoryTransaction({
              companyId: invoice.companyId,
              inventoryItemId: lineItem.inventoryItemId,
              transactionType: "ADJUSTMENT",
              transactionDate: new Date(),
              quantityIn: lineItem.quantity,
              quantityOut: 0,
              unitCost: lineItem.unitPrice,
              totalValue: lineItem.amount,
              balanceAfter: inventoryItem.currentStock,
              referenceType: "INVOICE",
              referenceId: invoice._id,
              notes: `Reversal - Invoice ${invoice.invoiceNumber} voided`,
              createdBy: invoice.createdBy,
            });

            await transaction.save({ session });
          }
        }
      }
    } catch (error) {
      logger.logError(error as Error, { operation: "reverseInvoiceItems" });
      throw error;
    }
  },

  /**
   * Send invoice to customer via email
   */
  async sendInvoice(companyId: string, invoiceId: string, companyName: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        companyId,
      })
        .populate(
          "customerId",
          "customerName displayName email phone billingAddress",
        )
        .session(session);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Cannot send void invoices
      if (invoice.status === InvoiceStatus.VOID) {
        throw new Error("Cannot send voided invoice");
      }

      // Cannot send already paid invoices
      if (invoice.status === InvoiceStatus.PAID) {
        throw new Error("Invoice is already paid");
      }

      const customer = invoice.customerId as any;

      if (!customer.email) {
        throw new Error("Customer email not found");
      }

      const oldStatus = invoice.status;

      // Update status to SENT if it's currently DRAFT
      if (invoice.status === InvoiceStatus.DRAFT) {
        invoice.status = InvoiceStatus.SENT;
        await invoice.save({ session });

        // Process inventory and update customer balance for newly sent invoices
        await this.processInvoiceItems(invoice, session);
        await this.updateCustomerBalance(
          customer,
          invoice.totalAmount,
          session,
        );

        // Create automatic journal entry for newly sent invoice
        const journalEntryId =
          await JournalEntryService.createInvoiceJournalEntry(
            invoice,
            invoice.createdBy,
          );
        invoice.journalEntryId = journalEntryId;
        await invoice.save({ session });
      }

      // Calculate due date (invoice.dueDate is now a Date after our fix)
      const dueDate = new Date(invoice.dueDate);

      // Fetch company settings to get currency
      const companySettings = await CompanySettings.findOne({ companyId });
      const currency = companySettings?.accounting?.baseCurrency || "PHP";

      // Prepare company info for PDF generation
      const companyInfo = {
        name: companyName,
        address: process.env.COMPANY_ADDRESS,
        phone: process.env.COMPANY_PHONE,
        email: process.env.COMPANY_EMAIL || process.env.RESEND_FROM_EMAIL,
        website: process.env.COMPANY_WEBSITE,
        taxId: process.env.COMPANY_TAX_ID,
      };

      // Generate PDF attachment
      logger.info(
        `[Invoice Service] Generating PDF for invoice ${invoice.invoiceNumber}`,
      );
      const pdfBuffer = await PDFService.generateInvoicePDF(
        invoice,
        companyInfo,
        currency,
      );
      logger.info(
        `[Invoice Service] PDF generated successfully for invoice ${invoice.invoiceNumber}`,
        {
          pdfSize: pdfBuffer.length,
        },
      );

      // Send email with PDF attachment
      await EmailService.sendInvoice({
        customerEmail: customer.email,
        customerName: customer.displayName || customer.customerName,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        dueDate: dueDate.toLocaleDateString(),
        companyName: companyName,
        currency: currency,
        pdfAttachment: pdfBuffer,
      });

      await session.commitTransaction();

      // Populate and return the updated invoice
      const populatedInvoice = await Invoice.findById(invoice._id)
        .populate("customerId", "customerName displayName email")
        .populate("createdBy", "first_name last_name email");

      return populatedInvoice;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, { operation: "sendInvoice" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Update customer balance
   */
  async updateCustomerBalance(customer: any, amount: number, session: any) {
    try {
      // Initialize currentBalance if it's undefined or null
      if (
        customer.currentBalance === undefined ||
        customer.currentBalance === null ||
        isNaN(customer.currentBalance)
      ) {
        customer.currentBalance = 0;
      }
      customer.currentBalance += amount;
      await customer.save({ session });
    } catch (error) {
      logger.logError(error as Error, { operation: "updateCustomerBalance" });
      throw error;
    }
  },

  /**
   * Get payment history for an invoice
   */
  async getInvoicePayments(companyId: string, invoiceId: string) {
    try {
      const { Payment } = await import("../../models/Payment.js");

      const payments = await Payment.find({
        companyId,
        "allocations.documentId": invoiceId,
        "allocations.documentType": "INVOICE",
      })
        .populate("customerId", "customerName displayName email")
        .populate("bankAccountId", "accountCode accountName")
        .populate("createdBy", "first_name last_name email")
        .sort({ paymentDate: -1 });

      return payments;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "getInvoicePayments",
        companyId,
        invoiceId,
      });
      throw error;
    }
  },
};
