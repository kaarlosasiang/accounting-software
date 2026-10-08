import mongoose, { ClientSession } from "mongoose";

import logger from "../../config/logger.js";
import Account from "../../models/Account.js";
import { Bill } from "../../models/Bill.js";
import { Customer } from "../../models/Customer.js";
import { Invoice } from "../../models/Invoice.js";
import { Payment } from "../../models/Payment.js";
import { Supplier } from "../../models/Supplier.js";
import { JournalEntryService } from "../../services/journalEntryService.js";
import { OPEN_DOCUMENT_STATUSES } from "../../shared/helpers/documentTotals.js";
import {
  MONEY_TOLERANCE,
  moneyEquals,
  round2,
  sumMoney,
} from "../../shared/helpers/money.js";
import { BillStatus } from "../../shared/interface/IBill.js";
import { InvoiceStatus } from "../../shared/interface/IInvoice.js";
import { PaymentType } from "../../shared/interface/IPayment.js";

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
    const result = await recordPayment(
      PaymentType.RECEIVED,
      companyId,
      userId,
      paymentData,
    );
    return {
      payment: result.payment,
      invoicesUpdated: result.documentsUpdated,
      customerNewBalance: result.partyNewBalance,
    };
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
   * Calculate payment allocation from multiple invoices (customer) or bills (supplier)
   * Useful for UI to suggest allocations
   */
  async suggestPaymentAllocations(
    companyId: string,
    customerId: string | undefined,
    paymentAmount: number,
    supplierId?: string,
  ) {
    try {
      const allocations = [];
      let remainingAmount = paymentAmount;

      if (supplierId) {
        // Get all unpaid/partial bills for supplier
        const bills = await Bill.find({
          companyId,
          supplierId,
          status: { $in: [BillStatus.SENT, BillStatus.PARTIAL] },
        }).sort({ billDate: 1 }); // Oldest first (FIFO)

        for (const bill of bills) {
          if (remainingAmount <= 0) break;

          const billBalance =
            bill.balanceDue || bill.totalAmount - (bill.amountPaid || 0);
          const allocationAmount = Math.min(remainingAmount, billBalance);

          if (allocationAmount > 0) {
            allocations.push({
              documentId: bill._id,
              documentNumber: bill.billNumber,
              allocatedAmount: allocationAmount,
              documentType: "BILL",
              invoiceBalance: billBalance,
              remainingBalance: billBalance - allocationAmount,
            });

            remainingAmount -= allocationAmount;
          }
        }
      } else if (customerId) {
        // Get all unpaid/partial invoices for customer
        const invoices = await Invoice.find({
          companyId,
          customerId,
          status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL] },
        }).sort({ invoiceDate: 1 }); // Oldest first (FIFO)

        for (const invoice of invoices) {
          if (remainingAmount <= 0) break;

          const invoiceBalance =
            invoice.balanceDue ||
            invoice.totalAmount - (invoice.amountPaid || 0);
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
        supplierId,
      });
      throw error;
    }
  },

  /**
   * Record a payment made to a supplier
   * Supports partial payments and multi-bill allocations
   */
  async recordPaymentMade(companyId: string, userId: string, paymentData: any) {
    const result = await recordPayment(
      PaymentType.MADE,
      companyId,
      userId,
      paymentData,
    );
    return {
      payment: result.payment,
      billsUpdated: result.documentsUpdated,
      supplierNewBalance: result.partyNewBalance,
    };
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
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      const payment = await Payment.findOne({
        _id: paymentId,
        companyId: companyObjectId,
      }).session(session);

      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.status === "VOIDED") {
        throw new Error("Payment is already voided");
      }

      // 1. Reverse the GL posting
      if (payment.journalEntryId) {
        await JournalEntryService.reverseEntry({
          companyId,
          journalEntryId: payment.journalEntryId,
          userId,
          reason: `Payment ${payment.paymentNumber} voided`,
          session,
        });
      }

      // 2. Restore document balances (status is re-derived on save)
      const DocumentModel: any =
        payment.paymentType === PaymentType.RECEIVED ? Invoice : Bill;
      for (const allocation of payment.allocations) {
        const doc = await DocumentModel.findOne({
          _id: allocation.documentId,
          companyId: companyObjectId,
        }).session(session);
        if (!doc) continue;

        doc.amountPaid = round2(
          Math.max(0, (doc.amountPaid || 0) - allocation.allocatedAmount),
        );
        await doc.save({ session });
      }

      // 3. Restore the customer/supplier balance
      if (payment.paymentType === PaymentType.RECEIVED && payment.customerId) {
        await adjustBalance(
          Customer,
          companyObjectId,
          payment.customerId,
          payment.amount,
          session,
        );
      } else if (
        payment.paymentType === PaymentType.MADE &&
        payment.supplierId
      ) {
        await adjustBalance(
          Supplier,
          companyObjectId,
          payment.supplierId,
          payment.amount,
          session,
        );
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
      if (session.inTransaction()) await session.abortTransaction();
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

/**
 * Atomically add `amount` to a customer/supplier balance (company-scoped);
 * a missing/null balance is treated as 0. Returns the new balance.
 */
async function adjustBalance(
  model: any,
  companyId: mongoose.Types.ObjectId,
  partyId: unknown,
  amount: number,
  session: ClientSession,
): Promise<number | undefined> {
  const updated = await model
    .findOneAndUpdate(
      { _id: partyId, companyId },
      [
        {
          $set: {
            currentBalance: {
              $round: [
                {
                  $add: [{ $ifNull: ["$currentBalance", 0] }, round2(amount)],
                },
                2,
              ],
            },
          },
        },
      ],
      { new: true, session, updatePipeline: true },
    )
    .lean();
  return updated?.currentBalance;
}

/**
 * Record a payment received (customer → invoices) or made (supplier → bills).
 *
 * Validation:
 *  - the customer/supplier and bank/cash account belong to the company
 *  - every allocation is positive, of the right document type, unique,
 *    belongs to the same customer/supplier, is posted (not Draft/Void) and
 *    does not exceed the document's balance due
 *  - allocations sum to the payment amount
 *
 * The payment, document updates, balance change and journal entry (dated
 * on the payment date) are written in one transaction.
 */
async function recordPayment(
  paymentType: PaymentType,
  companyId: string,
  userId: string,
  paymentData: any,
) {
  const isReceived = paymentType === PaymentType.RECEIVED;
  const documentType = isReceived ? "INVOICE" : "BILL";
  const DocumentModel: any = isReceived ? Invoice : Bill;
  const PartyModel: any = isReceived ? Customer : Supplier;
  const partyField = isReceived ? "customerId" : "supplierId";
  const documentLabel = isReceived ? "invoice" : "bill";

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const partyId = paymentData?.[partyField];

    const party = await PartyModel.findOne({
      _id: partyId,
      companyId: companyObjectId,
    }).session(session);
    if (!party) {
      throw new Error(isReceived ? "Customer not found" : "Supplier not found");
    }

    const amount = round2(Number(paymentData?.amount));
    if (!(amount > 0)) {
      throw new Error("Payment amount must be greater than zero");
    }

    const paymentDate = paymentData?.paymentDate
      ? new Date(paymentData.paymentDate)
      : new Date();
    if (Number.isNaN(paymentDate.getTime())) {
      throw new Error("Invalid payment date");
    }

    // --- Allocations ---------------------------------------------------
    const rawAllocations: any[] = Array.isArray(paymentData?.allocations)
      ? paymentData.allocations
      : [];
    if (rawAllocations.length === 0) {
      throw new Error(`At least one ${documentLabel} allocation is required`);
    }

    const allocations = rawAllocations.map((alloc) => ({
      documentId: String(alloc?.documentId ?? ""),
      documentType: alloc?.documentType ?? documentType,
      allocatedAmount: round2(Number(alloc?.allocatedAmount)),
    }));

    for (const alloc of allocations) {
      if (alloc.documentType !== documentType) {
        throw new Error(
          `${isReceived ? "Received" : "Made"} payments can only be allocated to ${documentLabel}s`,
        );
      }
      if (!(alloc.allocatedAmount > 0)) {
        throw new Error("Allocated amounts must be greater than zero");
      }
      if (!mongoose.Types.ObjectId.isValid(alloc.documentId)) {
        throw new Error(`Invalid ${documentLabel} id: ${alloc.documentId}`);
      }
    }

    const uniqueIds = new Set(allocations.map((a) => a.documentId));
    if (uniqueIds.size !== allocations.length) {
      throw new Error(
        `Each ${documentLabel} can only appear once in a payment`,
      );
    }

    const totalAllocated = sumMoney(allocations.map((a) => a.allocatedAmount));
    if (!moneyEquals(totalAllocated, amount)) {
      throw new Error(
        `Total allocated amount (${totalAllocated}) must equal payment amount (${amount})`,
      );
    }

    const documents = await DocumentModel.find({
      _id: { $in: [...uniqueIds] },
      companyId: companyObjectId,
    }).session(session);
    if (documents.length !== uniqueIds.size) {
      throw new Error(
        `One or more ${documentLabel}s not found or don't belong to this company`,
      );
    }
    const documentById = new Map<string, any>(
      documents.map((d: any) => [d._id.toString(), d]),
    );

    for (const alloc of allocations) {
      const doc = documentById.get(alloc.documentId)!;
      if (String(doc[partyField]) !== String(party._id)) {
        throw new Error(
          `${doc.invoiceNumber ?? doc.billNumber} belongs to a different ${isReceived ? "customer" : "supplier"}`,
        );
      }
      if (!OPEN_DOCUMENT_STATUSES.includes(doc.status)) {
        throw new Error(
          `${doc.invoiceNumber ?? doc.billNumber} is ${doc.status} and cannot receive payments`,
        );
      }
      if (alloc.allocatedAmount - doc.balanceDue > MONEY_TOLERANCE) {
        throw new Error(
          `Allocation of ${alloc.allocatedAmount} exceeds the balance due (${doc.balanceDue}) on ${doc.invoiceNumber ?? doc.billNumber}`,
        );
      }
    }

    // --- Bank / cash account --------------------------------------------
    const bankAccount = await Account.findOne({
      _id: paymentData?.bankAccountId,
      companyId: companyObjectId,
      accountType: "Asset",
    }).session(session);
    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    // --- Persist -----------------------------------------------------------
    const payment = new Payment({
      companyId: companyObjectId,
      paymentDate,
      paymentType,
      paymentMethod: paymentData?.paymentMethod,
      referenceNumber: paymentData?.referenceNumber,
      amount,
      [partyField]: party._id,
      allocations: allocations.map((alloc) => {
        const doc = documentById.get(alloc.documentId)!;
        return {
          documentId: doc._id,
          documentNumber: doc.invoiceNumber ?? doc.billNumber,
          allocatedAmount: alloc.allocatedAmount,
          documentType,
        };
      }),
      bankAccountId: bankAccount._id,
      notes: paymentData?.notes || null,
      createdBy: userId,
    });
    await payment.save({ session });

    for (const alloc of allocations) {
      const doc = documentById.get(alloc.documentId)!;
      doc.amountPaid = round2((doc.amountPaid || 0) + alloc.allocatedAmount);
      await doc.save({ session }); // balance & status re-derived by the model
    }

    const counterAccountId = isReceived
      ? await JournalEntryService.getAccountsReceivableAccount(
          companyObjectId,
          session,
        )
      : await JournalEntryService.getAccountsPayableAccount(
          companyObjectId,
          session,
        );

    payment.journalEntryId =
      await JournalEntryService.createPaymentJournalEntry({
        amount,
        paymentDate,
        referenceNumber: payment.paymentNumber,
        description: isReceived
          ? `Payment received from ${party.customerName}`
          : `Payment made to ${party.supplierName}`,
        cashAccountId: bankAccount._id,
        receivablePayableAccountId: counterAccountId,
        companyId: companyObjectId,
        userId,
        isInvoicePayment: isReceived,
        paymentId: payment._id,
        session,
      });
    await payment.save({ session });

    const partyNewBalance = await adjustBalance(
      PartyModel,
      companyObjectId,
      party._id,
      -amount,
      session,
    );

    await session.commitTransaction();

    const populatedPayment = await Payment.findById(payment._id)
      .populate(
        partyField,
        isReceived ? "customerName email" : "supplierName email",
      )
      .populate("bankAccountId", "accountCode accountName")
      .populate("createdBy", "first_name last_name email");

    return {
      payment: populatedPayment,
      documentsUpdated: documents.length,
      partyNewBalance,
    };
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    logger.logError(error as Error, {
      operation: isReceived ? "recordPaymentReceived" : "recordPaymentMade",
      companyId,
    });
    throw error;
  } finally {
    session.endSession();
  }
}
