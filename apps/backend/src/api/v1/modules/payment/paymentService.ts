import mongoose from "mongoose";
import { Payment } from "../../models/Payment.js";
import { Invoice } from "../../models/Invoice.js";
import { Customer } from "../../models/Customer.js";
import { JournalEntry } from "../../models/JournalEntry.js";
import Account from "../../models/Account.js";
import {
  PaymentType,
  IPaymentAllocation,
} from "../../shared/interface/IPayment.js";
import { InvoiceStatus } from "../../shared/interface/IInvoice.js";
import logger from "../../config/logger.js";
import { generateDocumentNumber } from "../../utils/documentNumberGenerator.js";

/**
 * Payment Service
 * Handles all business logic for payments (received and made)
 */
export const paymentService = {
  /**
   * Record a payment received from a customer
   * Supports partial payments and multi-invoice allocations
   *
   * @param companyId - Company ID
   * @param userId - User creating the payment
   * @param paymentData - Payment details including allocations
   *
   * Example payload:
   * {
   *   customerId: "customer-id",
   *   paymentDate: "2025-01-25",
   *   paymentMethod: "BANK_TRANSFER",
   *   referenceNumber: "TXN-12345",
   *   amount: 15000,
   *   bankAccountId: "bank-account-id",
   *   allocations: [
   *     { invoiceId: "inv1", documentNumber: "INV-2025-001", allocatedAmount: 10000, documentType: "INVOICE" },
   *     { invoiceId: "inv2", documentNumber: "INV-2025-002", allocatedAmount: 5000, documentType: "INVOICE" }
   *   ],
   *   notes: "Payment for invoices 001 and 002"
   * }
   */
  async recordPaymentReceived(
    companyId: string,
    userId: string,
    paymentData: any,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate customer exists
      const customer = await Customer.findOne({
        _id: paymentData.customerId,
        companyId,
      }).session(session);

      if (!customer) {
        throw new Error("Customer not found");
      }

      // 2. Validate allocations and invoices
      const allocations = paymentData.allocations || [];
      if (!allocations || allocations.length === 0) {
        throw new Error("At least one invoice allocation is required");
      }

      // Verify total allocated amount matches payment amount
      const totalAllocated = allocations.reduce(
        (sum: number, alloc: any) => sum + alloc.allocatedAmount,
        0,
      );

      if (Math.abs(totalAllocated - paymentData.amount) > 0.01) {
        throw new Error(
          `Total allocated amount (${totalAllocated}) must equal payment amount (${paymentData.amount})`,
        );
      }

      // 3. Fetch and validate all referenced invoices
      const invoiceIds = allocations
        .filter((a: any) => a.documentType === "INVOICE")
        .map((a: any) => a.documentId);

      const invoices = await Invoice.find({
        _id: { $in: invoiceIds },
        companyId,
      }).session(session);

      if (invoices.length !== invoiceIds.length) {
        throw new Error(
          "One or more invoices not found or don't belong to this company",
        );
      }

      // 4. Validate bank account exists
      const bankAccount = await Account.findOne({
        _id: paymentData.bankAccountId,
        companyId,
      }).session(session);

      if (!bankAccount) {
        throw new Error("Bank account not found");
      }

      // 5. Generate payment number
      const paymentNumber = await generateDocumentNumber({
        companyId,
        documentType: "PAYMENT",
        session,
      });

      // 6. Create payment record with allocations
      const payment = new Payment({
        companyId,
        paymentNumber,
        paymentDate: paymentData.paymentDate,
        paymentType: PaymentType.RECEIVED,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        amount: paymentData.amount,
        customerId: paymentData.customerId,
        allocations: allocations.map((alloc: any) => ({
          documentId: alloc.documentId,
          documentNumber: alloc.documentNumber,
          allocatedAmount: alloc.allocatedAmount,
          documentType: "INVOICE",
        })),
        bankAccountId: paymentData.bankAccountId,
        notes: paymentData.notes || null,
        createdBy: userId,
      });

      await payment.save({ session });

      // 7. Update invoices with payment amounts and create journal entry
      const journalEntryLines: any[] = [];
      let totalDebit = 0;
      let totalCredit = 0;

      for (const allocation of allocations) {
        const invoice = invoices.find(
          (inv) => inv._id.toString() === allocation.documentId.toString(),
        );

        if (!invoice) continue;

        // Update invoice with payment
        invoice.amountPaid = (invoice.amountPaid || 0) + allocation.allocatedAmount;
        invoice.balanceDue =
          invoice.totalAmount - invoice.amountPaid;

        // Auto-update status based on balance
        if (Math.abs(invoice.balanceDue) < 0.01) {
          invoice.status = InvoiceStatus.PAID;
        } else if (invoice.amountPaid > 0 && invoice.balanceDue > 0) {
          invoice.status = InvoiceStatus.PARTIAL;
        }

        await invoice.save({ session });

        // Create journal entry lines for this allocation
        // Debit: Bank Account (asset increases)
        journalEntryLines.push({
          accountId: bankAccount._id,
          description: `Payment received from ${customer.customerName} for ${allocation.documentNumber}`,
          debit: allocation.allocatedAmount,
          credit: 0,
        });

        // Credit: Accounts Receivable (reduces what customer owes)
        const arAccountId = await this.getAccountsReceivableAccount(
          companyId,
          session,
        );
        journalEntryLines.push({
          accountId: arAccountId,
          description: `Payment applied to ${allocation.documentNumber}`,
          debit: 0,
          credit: allocation.allocatedAmount,
        });

        totalDebit += allocation.allocatedAmount;
        totalCredit += allocation.allocatedAmount;
      }

      // 8. Create journal entry
      const journalEntry = new JournalEntry({
        companyId,
        entryDate: paymentData.paymentDate,
        description: `Payment received from ${customer.customerName} (${paymentNumber})`,
        entryType: "Payment",
        lines: journalEntryLines,
        totalDebit,
        totalCredit,
        status: "Posted",
        postedBy: userId,
        createdBy: userId,
      });

      await journalEntry.save({ session });

      // Link payment to journal entry
      payment.journalEntryId = journalEntry._id;
      await payment.save({ session });

      // 9. Update customer balance
      const customerNewBalance =
        customer.currentBalance - paymentData.amount;
      customer.currentBalance = customerNewBalance;
      await customer.save({ session });

      await session.commitTransaction();

      // Populate and return the created payment
      const populatedPayment = await Payment.findById(payment._id)
        .populate("customerId", "customerName email")
        .populate("bankAccountId", "accountCode accountName")
        .populate("createdBy", "first_name last_name email");

      return {
        payment: populatedPayment,
        invoicesUpdated: invoices.length,
        customerNewBalance,
      };
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, {
        operation: "recordPaymentReceived",
        companyId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Get all payments received for a company
   */
  async getPaymentsReceived(companyId: string) {
    try {
      const payments = await Payment.find({
        companyId,
        paymentType: PaymentType.RECEIVED,
      })
        .populate("customerId", "customerName displayName email")
        .populate("bankAccountId", "accountCode accountName")
        .populate("createdBy", "first_name last_name email")
        .sort({ paymentDate: -1 });

      return payments;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "getPaymentsReceived",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Get payments for a specific customer
   */
  async getCustomerPayments(companyId: string, customerId: string) {
    try {
      const payments = await Payment.find({
        companyId,
        customerId,
        paymentType: PaymentType.RECEIVED,
      })
        .populate("bankAccountId", "accountCode accountName")
        .populate("createdBy", "first_name last_name email")
        .sort({ paymentDate: -1 });

      return payments;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "getCustomerPayments",
        companyId,
        customerId,
      });
      throw error;
    }
  },

  /**
   * Get payment by ID
   */
  async getPaymentById(companyId: string, paymentId: string) {
    try {
      const payment = await Payment.findOne({
        _id: paymentId,
        companyId,
      })
        .populate("customerId", "customerName email phone")
        .populate("bankAccountId", "accountCode accountName")
        .populate("createdBy", "first_name last_name email")
        .populate("journalEntryId");

      if (!payment) {
        throw new Error("Payment not found");
      }

      return payment;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "getPaymentById",
        companyId,
        paymentId,
      });
      throw error;
    }
  },

  /**
   * Helper: Get or create Accounts Receivable account
   */
  // Internal helper; not exported outside the service
  async getAccountsReceivableAccount(
    companyId: string,
    session: mongoose.ClientSession,
  ) {
    const arAccount = await Account.findOne({
      companyId,
      accountCode: "1200", // Standard AR account code
    }).session(session);

    if (!arAccount) {
      throw new Error(
        "Accounts Receivable account not found in chart of accounts",
      );
    }

    return arAccount._id;
  },

  /**
   * Calculate payment allocation from multiple invoices
   * Useful for UI to suggest allocations
   */
  async suggestPaymentAllocations(
    companyId: string,
    customerId: string,
    paymentAmount: number,
  ) {
    try {
      // Get all unpaid/partial invoices for customer
      const invoices = await Invoice.find({
        companyId,
        customerId,
        status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL] },
      }).sort({ invoiceDate: 1 }); // Oldest first (FIFO)

      const allocations = [];
      let remainingAmount = paymentAmount;

      // Allocate payment to invoices in order (oldest first)
      for (const invoice of invoices) {
        if (remainingAmount <= 0) break;

        const invoiceBalance = invoice.balanceDue || invoice.totalAmount - (invoice.amountPaid || 0);
        const allocationAmount = Math.min(remainingAmount, invoiceBalance);

        if (allocationAmount > 0) {
          allocations.push({
            documentId: invoice._id,
            documentNumber: invoice.invoiceNumber,
            allocatedAmount: allocationAmount,
            documentType: "INVOICE",
            invoiceBalance,
            remainingBalance: invoiceBalance - allocationAmount,
          });

          remainingAmount -= allocationAmount;
        }
      }

      return {
        allocations,
        remainingBalance: remainingAmount,
        totalAllocated: paymentAmount - remainingAmount,
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "suggestPaymentAllocations",
        companyId,
        customerId,
      });
      throw error;
    }
  },
};
