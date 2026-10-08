import mongoose, { ClientSession } from "mongoose";

import logger from "../../config/logger.js";
import { CompanySettings } from "../../models/CompanySettings.js";
import { Customer } from "../../models/Customer.js";
import { InventoryItem } from "../../models/InventoryItem.js";
import { InventoryTransaction } from "../../models/InventoryTransaction.js";
import { Invoice } from "../../models/Invoice.js";
import { EmailService } from "../../services/email.service.js";
import { JournalEntryService } from "../../services/journalEntryService.js";
import { PDFService } from "../../services/pdf.service.js";
import { OPEN_DOCUMENT_STATUSES } from "../../shared/helpers/documentTotals.js";
import { escapeRegex } from "../../shared/helpers/escapeRegex.js";
import { round2 } from "../../shared/helpers/money.js";
import {
  InventoryReferenceType,
  InventoryTransactionType,
} from "../../shared/interface/IInventoryTransaction.js";
import {
  IInvoiceDocument,
  InvoiceStatus,
} from "../../shared/interface/IInvoice.js";

/** Fields a client may set when creating or editing a draft invoice. */
const DRAFT_EDITABLE_FIELDS = [
  "customerId",
  "invoiceDate",
  "dueDate",
  "lineItems",
  "taxRate",
  "discount",
  "notes",
  "terms",
] as const;

/**
 * Fields that may change on a posted invoice. Anything that affects amounts
 * or accounts requires voiding and re-issuing, otherwise the document would
 * drift from its journal entry.
 */
const POSTED_EDITABLE_FIELDS = ["dueDate", "notes", "terms"] as const;

const LINE_ITEM_FIELDS = [
  "description",
  "quantity",
  "unitPrice",
  "accountId",
  "inventoryItemId",
] as const;

const pick = <T extends string>(
  source: Record<string, any>,
  fields: readonly T[],
): Partial<Record<T, any>> => {
  const result: Partial<Record<T, any>> = {};
  for (const field of fields) {
    if (source[field] !== undefined) result[field] = source[field];
  }
  return result;
};

/** Whitelist invoice input (top-level and line items). */
const sanitizeInvoiceInput = (
  data: Record<string, any>,
  fields: readonly string[],
) => {
  const clean = pick(data ?? {}, fields);
  if (Array.isArray(clean.lineItems)) {
    clean.lineItems = clean.lineItems.map((item: Record<string, any>) =>
      pick(item ?? {}, LINE_ITEM_FIELDS),
    );
  }
  return clean;
};

/** True when the client asked for the invoice to be posted (not a draft). */
const wantsPosting = (status: unknown) =>
  typeof status === "string" &&
  status !== InvoiceStatus.DRAFT &&
  status !== InvoiceStatus.VOID;

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
   * Create new invoice. Invoices are created as drafts; when the client asks
   * for a non-draft status the invoice is posted in the same transaction.
   */
  async createInvoice(companyId: string, userId: string, invoiceData: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customer = await Customer.findOne({
        _id: invoiceData?.customerId,
        companyId,
      }).session(session);

      if (!customer) {
        throw new Error("Customer not found");
      }

      const invoice = new Invoice({
        ...sanitizeInvoiceInput(invoiceData, DRAFT_EDITABLE_FIELDS),
        companyId,
        createdBy: userId,
        status: InvoiceStatus.DRAFT,
        amountPaid: 0,
        taxBase: "afterDiscount",
      });

      await invoice.save({ session });

      if (wantsPosting(invoiceData?.status)) {
        await this.postInvoice(invoice, userId, session);
      }

      await session.commitTransaction();

      return await Invoice.findById(invoice._id)
        .populate("customerId", "customerName displayName email")
        .populate("createdBy", "first_name last_name email");
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      logger.logError(error as Error, { operation: "createInvoice" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Update invoice.
   * - Drafts: any editable field; may be posted by sending a non-draft status.
   * - Posted invoices: only due date, notes and terms.
   */
  async updateInvoice(
    companyId: string,
    invoiceId: string,
    updateData: any,
    userId?: string,
  ) {
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

      if (
        invoice.status === InvoiceStatus.PAID ||
        invoice.status === InvoiceStatus.VOID
      ) {
        throw new Error(
          `Cannot update ${invoice.status.toLowerCase()} invoice`,
        );
      }

      const isDraft = invoice.status === InvoiceStatus.DRAFT;

      if (isDraft) {
        const changes = sanitizeInvoiceInput(updateData, DRAFT_EDITABLE_FIELDS);
        if (
          changes.customerId &&
          String(changes.customerId) !== String(invoice.customerId)
        ) {
          const customer = await Customer.findOne({
            _id: changes.customerId,
            companyId,
          }).session(session);
          if (!customer) throw new Error("Customer not found");
        }
        Object.assign(invoice, changes);
      } else {
        const blocked = Object.keys(updateData ?? {}).filter(
          (key) =>
            (DRAFT_EDITABLE_FIELDS as readonly string[]).includes(key) &&
            !(POSTED_EDITABLE_FIELDS as readonly string[]).includes(key) &&
            JSON.stringify(updateData[key]) !==
              JSON.stringify((invoice as any)[key]),
        );
        if (blocked.length > 0) {
          throw new Error(
            `Cannot change ${blocked.join(", ")} on a posted invoice. Void it and issue a new invoice instead.`,
          );
        }
        Object.assign(
          invoice,
          sanitizeInvoiceInput(updateData, POSTED_EDITABLE_FIELDS),
        );
      }

      await invoice.save({ session });

      if (isDraft && wantsPosting(updateData?.status)) {
        await this.postInvoice(
          invoice,
          userId ?? String(invoice.createdBy),
          session,
        );
      }

      await session.commitTransaction();

      return await Invoice.findById(invoice._id)
        .populate("customerId", "customerName displayName email")
        .populate("createdBy", "first_name last_name email");
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      logger.logError(error as Error, { operation: "updateInvoice" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Post a draft invoice: relieve inventory, raise the customer balance and
   * write the journal entry. Idempotent — an invoice that already has a
   * journal entry is never posted twice.
   */
  async postInvoice(
    invoice: IInvoiceDocument,
    userId: string,
    session: ClientSession,
  ) {
    if (invoice.journalEntryId) {
      return invoice;
    }
    if (invoice.status === InvoiceStatus.VOID) {
      throw new Error("Cannot post a void invoice");
    }

    invoice.status = InvoiceStatus.SENT;
    await invoice.save({ session });

    await this.processInvoiceItems(invoice, session);
    await this.adjustCustomerBalance(
      invoice.companyId,
      invoice.customerId,
      invoice.totalAmount,
      session,
    );

    invoice.journalEntryId =
      await JournalEntryService.createInvoiceJournalEntry(
        invoice,
        userId,
        session,
      );
    await invoice.save({ session });

    return invoice;
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

      if (invoice.status !== InvoiceStatus.DRAFT || invoice.journalEntryId) {
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
   * Void invoice. Unwinds only what was actually posted: the journal entry is
   * reversed, the customer balance reduced and inventory restored. Voiding a
   * draft just marks it void.
   */
  async voidInvoice(companyId: string, invoiceId: string, userId?: string) {
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

      // Capture BEFORE changing the status.
      const wasPosted =
        invoice.status !== InvoiceStatus.DRAFT || !!invoice.journalEntryId;

      invoice.void();
      await invoice.save({ session });

      if (wasPosted) {
        if (invoice.journalEntryId) {
          await JournalEntryService.reverseEntry({
            companyId,
            journalEntryId: invoice.journalEntryId,
            userId: userId ?? String(invoice.createdBy),
            reason: `Invoice ${invoice.invoiceNumber} voided`,
            session,
          });
        }

        await this.adjustCustomerBalance(
          invoice.companyId,
          invoice.customerId,
          -invoice.balanceDue,
          session,
        );
        await this.reverseInvoiceItems(invoice, session);
      }

      await session.commitTransaction();

      return invoice;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
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
   * Get overdue invoices (any open invoice past its due date)
   */
  async getOverdueInvoices(companyId: string) {
    try {
      const invoices = await Invoice.find({
        companyId,
        status: { $in: OPEN_DOCUMENT_STATUSES },
        dueDate: { $lt: new Date() },
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
      const safeTerm = escapeRegex(searchTerm);
      const customers = await Customer.find({
        companyId,
        $or: [
          { customerName: { $regex: safeTerm, $options: "i" } },
          { displayName: { $regex: safeTerm, $options: "i" } },
          { email: { $regex: safeTerm, $options: "i" } },
        ],
      }).select("_id");

      const customerIds = customers.map((c) => c._id);

      const invoices = await Invoice.find({
        companyId,
        $or: [
          { invoiceNumber: { $regex: safeTerm, $options: "i" } },
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
   * Process invoice items (reduce inventory when invoice is posted).
   * Inventory transactions are valued at cost, not selling price.
   */
  async processInvoiceItems(invoice: any, session: ClientSession) {
    for (const lineItem of invoice.lineItems) {
      if (!lineItem.inventoryItemId) continue;

      const inventoryItem = await InventoryItem.findOne({
        _id: lineItem.inventoryItemId,
        companyId: invoice.companyId,
      }).session(session);

      if (!inventoryItem) {
        throw new Error(
          `Inventory item not found: ${lineItem.inventoryItemId}`,
        );
      }

      // Service items do not reduce on-hand inventory.
      if (inventoryItem.itemType !== "Product") continue;

      if (inventoryItem.quantityOnHand < lineItem.quantity) {
        throw new Error(
          `Insufficient stock for ${inventoryItem.itemName}. Available: ${inventoryItem.quantityOnHand}, Required: ${lineItem.quantity}`,
        );
      }

      inventoryItem.quantityOnHand -= lineItem.quantity;
      await inventoryItem.save({ session });

      const unitCost = inventoryItem.unitCost || 0;
      await new InventoryTransaction({
        companyId: invoice.companyId,
        inventoryItemId: lineItem.inventoryItemId,
        transactionType: InventoryTransactionType.SALE,
        transactionDate: invoice.invoiceDate || new Date(),
        quantityIn: 0,
        quantityOut: lineItem.quantity,
        unitCost,
        totalValue: round2(unitCost * lineItem.quantity),
        balanceAfter: inventoryItem.quantityOnHand,
        referenceType: InventoryReferenceType.INVOICE,
        referenceId: invoice._id,
        notes: `Sale via Invoice ${invoice.invoiceNumber}`,
        createdBy: invoice.createdBy,
      }).save({ session });
    }
  },

  /**
   * Reverse invoice items (when voiding a posted invoice)
   */
  async reverseInvoiceItems(invoice: any, session: ClientSession) {
    for (const lineItem of invoice.lineItems) {
      if (!lineItem.inventoryItemId) continue;

      const inventoryItem = await InventoryItem.findOne({
        _id: lineItem.inventoryItemId,
        companyId: invoice.companyId,
      }).session(session);

      if (!inventoryItem || inventoryItem.itemType !== "Product") continue;

      inventoryItem.quantityOnHand += lineItem.quantity;
      await inventoryItem.save({ session });

      const unitCost = inventoryItem.unitCost || 0;
      await new InventoryTransaction({
        companyId: invoice.companyId,
        inventoryItemId: lineItem.inventoryItemId,
        transactionType: InventoryTransactionType.ADJUSTMENT,
        transactionDate: new Date(),
        quantityIn: lineItem.quantity,
        quantityOut: 0,
        unitCost,
        totalValue: round2(unitCost * lineItem.quantity),
        balanceAfter: inventoryItem.quantityOnHand,
        referenceType: InventoryReferenceType.INVOICE,
        referenceId: invoice._id,
        notes: `Reversal - Invoice ${invoice.invoiceNumber} voided`,
        createdBy: invoice.createdBy,
      }).save({ session });
    }
  },

  /**
   * Send invoice to customer via email.
   *
   * Posting a draft happens in its own transaction which commits BEFORE the
   * PDF/email work, so a slow or failing email provider can neither hold a
   * transaction open nor leave half-posted accounting data behind.
   */
  async sendInvoice(companyId: string, invoiceId: string, userId?: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    let invoice: IInvoiceDocument | null;
    try {
      invoice = (await Invoice.findOne({
        _id: invoiceId,
        companyId,
      }).session(session)) as IInvoiceDocument | null;

      if (!invoice) {
        throw new Error("Invoice not found");
      }
      if (invoice.status === InvoiceStatus.VOID) {
        throw new Error("Cannot send voided invoice");
      }
      if (invoice.status === InvoiceStatus.PAID) {
        throw new Error("Invoice is already paid");
      }

      const customer = await Customer.findOne({
        _id: invoice.customerId,
        companyId,
      })
        .select("email")
        .session(session)
        .lean();
      if (!customer?.email) {
        throw new Error("Customer email not found");
      }

      if (invoice.status === InvoiceStatus.DRAFT) {
        await this.postInvoice(
          invoice,
          userId ?? String(invoice.createdBy),
          session,
        );
      }

      await session.commitTransaction();
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      logger.logError(error as Error, { operation: "sendInvoice" });
      throw error;
    } finally {
      session.endSession();
    }

    const populated = await Invoice.findById(invoice._id).populate(
      "customerId",
      "customerName displayName email phone billingAddress",
    );
    const customer = populated!.customerId as any;

    try {
      const companyName = await this.getCompanyName(companyId);
      const companySettings = await CompanySettings.findOne({ companyId });
      const currency = companySettings?.accounting?.baseCurrency || "PHP";

      const companyInfo = {
        name: companyName,
        address: process.env.COMPANY_ADDRESS,
        phone: process.env.COMPANY_PHONE,
        email: process.env.COMPANY_EMAIL || process.env.RESEND_FROM_EMAIL,
        website: process.env.COMPANY_WEBSITE,
        taxId: process.env.COMPANY_TAX_ID,
      };

      const pdfBuffer = await PDFService.generateInvoicePDF(
        populated!,
        companyInfo,
        currency,
      );

      await EmailService.sendInvoice({
        customerEmail: customer.email,
        customerName: customer.displayName || customer.customerName,
        invoiceNumber: populated!.invoiceNumber,
        totalAmount: populated!.totalAmount,
        dueDate: new Date(populated!.dueDate).toLocaleDateString(),
        companyName,
        currency,
        pdfAttachment: pdfBuffer,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "sendInvoice-email",
        invoiceId,
      });
      throw new Error(
        `Invoice ${populated!.invoiceNumber} was posted but the email could not be sent. Please try sending it again later.`,
      );
    }

    return await Invoice.findById(invoice._id)
      .populate("customerId", "customerName displayName email")
      .populate("createdBy", "first_name last_name email");
  },

  /**
   * Resolve the company's display name from the organization record.
   */
  async getCompanyName(companyId: string): Promise<string> {
    const fallback = process.env.COMPANY_NAME || "Your supplier";
    if (
      !mongoose.Types.ObjectId.isValid(companyId) ||
      !mongoose.connection.db
    ) {
      return fallback;
    }
    const company = await mongoose.connection.db
      .collection("company")
      .findOne(
        { _id: new mongoose.Types.ObjectId(companyId) },
        { projection: { name: 1 } },
      );
    return (company?.name as string | undefined) || fallback;
  },

  /**
   * Atomically adjust a customer's balance (company-scoped).
   */
  async adjustCustomerBalance(
    companyId: mongoose.Types.ObjectId | string,
    customerId: any,
    amount: number,
    session: ClientSession,
  ) {
    const id = customerId?._id ?? customerId;
    // Pipeline update so a missing/null balance is treated as 0.
    await Customer.updateOne(
      { _id: id, companyId },
      [
        {
          $set: {
            currentBalance: {
              $round: [
                { $add: [{ $ifNull: ["$currentBalance", 0] }, round2(amount)] },
                2,
              ],
            },
          },
        },
      ],
      { session, updatePipeline: true },
    );
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
