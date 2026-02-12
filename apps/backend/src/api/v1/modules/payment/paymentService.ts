import mongoose from "mongoose";
import { Payment } from "../../models/Payment.js";
import { Invoice } from "../../models/Invoice.js";
import { Bill } from "../../models/Bill.js";
import { Customer } from "../../models/Customer.js";
import { Supplier } from "../../models/Supplier.js";
import { JournalEntry } from "../../models/JournalEntry.js";
import Account from "../../models/Account.js";
import {
  PaymentType,
  IPaymentAllocation,
} from "../../shared/interface/IPayment.js";
import { InvoiceStatus } from "../../shared/interface/IInvoice.js";
import { BillStatus } from "../../shared/interface/IBill.js";
import logger from "../../config/logger.js";
import { JournalEntryService } from "../../services/journalEntryService.js";

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
      // 5. Generate simple payment number
      const timestamp = Date.now();
      const year = new Date().getFullYear();
      const sequence = timestamp % 10000;
      const paymentNumber = `PAY-${year}-${sequence.toString().padStart(4, "0")}`;

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

      // 7. Update invoices with payment amounts
      for (const allocation of allocations) {
        const invoice = invoices.find(
          (inv) => inv._id.toString() === allocation.documentId.toString(),
        );

        if (!invoice) continue;

        // Update invoice with payment
        invoice.amountPaid =
          (invoice.amountPaid || 0) + allocation.allocatedAmount;
        invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;

        // Auto-update status based on balance
        if (Math.abs(invoice.balanceDue) < 0.01) {
          invoice.status = InvoiceStatus.PAID;
        } else if (invoice.amountPaid > 0 && invoice.balanceDue > 0) {
          invoice.status = InvoiceStatus.PARTIAL;
        }

        await invoice.save({ session });
      }

      // 8. Create journal entry using the JournalEntryService
      const arAccountId =
        await JournalEntryService.getAccountsReceivableAccount(
          new mongoose.Types.ObjectId(companyId),
        );

      const journalEntryId =
        await JournalEntryService.createPaymentJournalEntry(
          paymentData.amount,
          paymentNumber,
          `Payment received from ${customer.customerName}`,
          bankAccount._id,
          arAccountId,
          new mongoose.Types.ObjectId(companyId),
          new mongoose.Types.ObjectId(userId),
          true, // isInvoicePayment
        );

      // Link payment to journal entry
      payment.journalEntryId = journalEntryId;
      await payment.save({ session });

      // 9. Update customer balance
      const customerNewBalance = customer.currentBalance - paymentData.amount;
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
   * Get all payments made for a company
   */
  async getPaymentsMade(companyId: string) {
    try {
      const payments = await Payment.find({
        companyId,
        paymentType: PaymentType.MADE,
      })
        .populate("supplierId", "supplierName displayName email")
        .populate("bankAccountId", "accountCode accountName")
        .populate("createdBy", "first_name last_name email")
        .sort({ paymentDate: -1 });

      return payments;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "getPaymentsMade",
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

        const invoiceBalance =
          invoice.balanceDue || invoice.totalAmount - (invoice.amountPaid || 0);
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

  /**
   * Record a payment made to a supplier
   * Supports partial payments and multi-bill allocations
   */
  async recordPaymentMade(companyId: string, userId: string, paymentData: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate supplier exists
      const supplier = await Supplier.findOne({
        _id: paymentData.supplierId,
        companyId,
      }).session(session);

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      // 2. Validate allocations and bills
      const allocations = paymentData.allocations || [];
      if (!allocations || allocations.length === 0) {
        throw new Error("At least one bill allocation is required");
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

      // 3. Fetch and validate all referenced bills
      const billIds = allocations
        .filter((a: any) => a.documentType === "BILL")
        .map((a: any) => a.documentId);

      const bills = await Bill.find({
        _id: { $in: billIds },
        companyId,
      }).session(session);

      if (bills.length !== billIds.length) {
        throw new Error(
          "One or more bills not found or don't belong to this company",
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
      // 5. Generate simple payment number
      const timestamp = Date.now();
      const year = new Date().getFullYear();
      const sequence = timestamp % 10000;
      const paymentNumber = `PAY-${year}-${sequence.toString().padStart(4, "0")}`;

      // 6. Create payment record with allocations
      const payment = new Payment({
        companyId,
        paymentNumber,
        paymentDate: paymentData.paymentDate,
        paymentType: PaymentType.MADE,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        amount: paymentData.amount,
        supplierId: paymentData.supplierId,
        allocations: allocations.map((alloc: any) => ({
          documentId: alloc.documentId,
          documentNumber: alloc.documentNumber,
          allocatedAmount: alloc.allocatedAmount,
          documentType: "BILL",
        })),
        bankAccountId: paymentData.bankAccountId,
        notes: paymentData.notes || null,
        createdBy: userId,
      });

      await payment.save({ session });

      // 7. Update bills with payment amounts
      for (const allocation of allocations) {
        const bill = bills.find(
          (b) => b._id.toString() === allocation.documentId.toString(),
        );

        if (!bill) continue;

        // Update bill with payment
        bill.amountPaid = (bill.amountPaid || 0) + allocation.allocatedAmount;
        bill.balanceDue = bill.totalAmount - bill.amountPaid;

        // Auto-update status based on balance
        if (Math.abs(bill.balanceDue) < 0.01) {
          bill.status = BillStatus.PAID;
        } else if (bill.amountPaid > 0 && bill.balanceDue > 0) {
          bill.status = BillStatus.PARTIAL;
        }

        await bill.save({ session });
      }

      // 8. Create journal entry using the JournalEntryService
      const apAccountId = await JournalEntryService.getAccountsPayableAccount(
        new mongoose.Types.ObjectId(companyId),
      );

      const journalEntryId =
        await JournalEntryService.createPaymentJournalEntry(
          paymentData.amount,
          paymentNumber,
          `Payment made to ${supplier.supplierName}`,
          bankAccount._id,
          apAccountId,
          new mongoose.Types.ObjectId(companyId),
          new mongoose.Types.ObjectId(userId),
          false, // isInvoicePayment (this is a bill payment)
        );

      // Link payment to journal entry
      payment.journalEntryId = journalEntryId;
      await payment.save({ session });

      // 9. Update supplier balance
      const supplierNewBalance =
        (supplier.currentBalance || 0) - paymentData.amount;
      supplier.currentBalance = supplierNewBalance;
      await supplier.save({ session });

      await session.commitTransaction();

      // Populate and return created payment
      const populatedPayment = await Payment.findById(payment._id)
        .populate("supplierId", "supplierName email")
        .populate("bankAccountId", "accountCode accountName")
        .populate("createdBy", "first_name last_name email");

      return {
        payment: populatedPayment,
        billsUpdated: bills.length,
        supplierNewBalance,
      };
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, {
        operation: "recordPaymentMade",
        companyId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Helper: Get or create Accounts Payable account
   */
  async getAccountsPayableAccount(
    companyId: string,
    session: mongoose.ClientSession,
  ) {
    const apAccount = await Account.findOne({
      companyId,
      accountCode: "2000", // Standard AP account code
    }).session(session);

    if (!apAccount) {
      throw new Error(
        "Accounts Payable account not found in chart of accounts",
      );
    }

    return apAccount._id;
  },

  /**
   * Void a payment (reverse the transaction)
   * - Updates payment status to VOIDED
   * - Voids the related journal entry
   * - Restores invoice/bill balances
   * - Restores customer/supplier balances
   */
  async voidPayment(companyId: string, paymentId: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find the payment
      const payment = await Payment.findOne({
        _id: paymentId,
        companyId: new mongoose.Types.ObjectId(companyId),
      }).session(session);

      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.status === "VOIDED") {
        throw new Error("Payment is already voided");
      }

      // 2. Void the related journal entry
      if (payment.journalEntryId) {
        await JournalEntryService.voidJournalEntry(
          companyId,
          payment.journalEntryId.toString(),
          userId,
          session,
        );
      }

      // 3. Reverse allocations based on payment type
      if (payment.paymentType === PaymentType.RECEIVED) {
        // Payment received from customer - reverse invoice allocations
        for (const allocation of payment.allocations) {
          const invoice = await Invoice.findOne({
            _id: allocation.documentId,
            companyId: new mongoose.Types.ObjectId(companyId),
          }).session(session);

          if (invoice) {
            // Restore invoice balance
            invoice.amountPaid = Math.max(
              0,
              (invoice.amountPaid || 0) - allocation.allocatedAmount,
            );
            invoice.balanceDue =
              invoice.totalAmount - (invoice.amountPaid || 0);

            // Update invoice status
            if (Math.abs(invoice.balanceDue - invoice.totalAmount) < 0.01) {
              invoice.status = InvoiceStatus.SENT; // Back to unpaid
            } else if (invoice.balanceDue > 0 && invoice.amountPaid > 0) {
              invoice.status = InvoiceStatus.PARTIAL;
            }

            await invoice.save({ session });
          }
        }

        // Restore customer balance
        if (payment.customerId) {
          const customer = await Customer.findOne({
            _id: payment.customerId,
            companyId: new mongoose.Types.ObjectId(companyId),
          }).session(session);

          if (customer) {
            customer.currentBalance =
              (customer.currentBalance || 0) + payment.amount;
            await customer.save({ session });
          }
        }
      } else if (payment.paymentType === PaymentType.MADE) {
        // Payment made to supplier - reverse bill allocations
        for (const allocation of payment.allocations) {
          const bill = await Bill.findOne({
            _id: allocation.documentId,
            companyId: new mongoose.Types.ObjectId(companyId),
          }).session(session);

          if (bill) {
            // Restore bill balance
            bill.amountPaid = Math.max(
              0,
              (bill.amountPaid || 0) - allocation.allocatedAmount,
            );
            bill.balanceDue = bill.totalAmount - (bill.amountPaid || 0);

            // Update bill status
            if (Math.abs(bill.balanceDue - bill.totalAmount) < 0.01) {
              bill.status = BillStatus.OPEN; // Back to unpaid
            } else if (bill.balanceDue > 0 && bill.amountPaid > 0) {
              bill.status = BillStatus.PARTIAL;
            }

            await bill.save({ session });
          }
        }

        // Restore supplier balance
        if (payment.supplierId) {
          const supplier = await Supplier.findOne({
            _id: payment.supplierId,
            companyId: new mongoose.Types.ObjectId(companyId),
          }).session(session);

          if (supplier) {
            supplier.currentBalance =
              (supplier.currentBalance || 0) + payment.amount;
            await supplier.save({ session });
          }
        }
      }

      // 4. Update payment status
      payment.status = "VOIDED";
      payment.voidedAt = new Date();
      payment.voidedBy = new mongoose.Types.ObjectId(userId);
      await payment.save({ session });

      await session.commitTransaction();

      logger.info("Payment voided successfully", {
        paymentId: payment._id,
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        paymentType: payment.paymentType,
        companyId,
      });

      return payment;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, {
        operation: "voidPayment",
        companyId,
        paymentId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  },
};
