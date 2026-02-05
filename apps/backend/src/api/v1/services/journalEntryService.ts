import mongoose from "mongoose";
import { JournalEntry } from "../models/JournalEntry.js";
import { JournalEntryType, JournalEntryStatus } from "../shared/interface/IJournalEntry.js";
import Account from "../models/Account.js";
import { IInvoice } from "../shared/interface/IInvoice.js";
import { IBill } from "../shared/interface/IBill.js";

interface JournalEntryLineInput {
  accountId: mongoose.Types.ObjectId;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

/**
 * Journal Entry Service
 * Handles automatic creation of journal entries for invoices and bills
 */
export class JournalEntryService {
  /**
   * Create journal entry for an invoice (double-entry bookkeeping)
   * Debit: Accounts Receivable (asset account)
   * Credit: Revenue accounts (from line items)
   * Credit: Sales Tax Liability (if applicable)
   */
  static async createInvoiceJournalEntry(
    invoice: IInvoice,
    userId: mongoose.Types.ObjectId
  ): Promise<mongoose.Types.ObjectId> {
    const companyId = invoice.companyId;
    
    // Get default Accounts Receivable account
    const arAccount = await Account.findOne({
      companyId,
      accountType: "Asset",
      $or: [
        { accountName: /Accounts Receivable/i },
        { accountName: /Trade Debtors/i },
        { subType: "Accounts Receivable" }
      ]
    });

    if (!arAccount) {
      throw new Error("Accounts Receivable account not found. Please set up your chart of accounts.");
    }

    // Get default Sales account
    const salesAccount = await Account.findOne({
      companyId,
      accountType: "Revenue",
      $or: [
        { accountName: /Sales/i },
        { accountName: /Revenue/i },
        { accountName: /Service Income/i }
      ]
    });

    if (!salesAccount) {
      throw new Error("Sales/Revenue account not found. Please set up your chart of accounts.");
    }

    // Get Sales Tax account
    const taxAccount = await Account.findOne({
      companyId,
      accountType: "Liability",
      $or: [
        { accountName: /Sales Tax/i },
        { accountName: /VAT/i },
        { accountName: /GST/i },
        { subType: "Sales Tax" }
      ]
    });

    const lines: JournalEntryLineInput[] = [];

    // Debit Accounts Receivable for the total amount
    lines.push({
      accountId: arAccount._id,
      accountCode: arAccount.accountCode,
      accountName: arAccount.accountName,
      debit: invoice.totalAmount,
      credit: 0,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerId?.toString() || 'Customer'}`
    });

    // Credit Sales for the subtotal (excluding tax)
    if (invoice.subtotal > 0) {
      lines.push({
        accountId: salesAccount._id,
        accountCode: salesAccount.accountCode,
        accountName: salesAccount.accountName,
        debit: 0,
        credit: invoice.subtotal,
        description: `Invoice ${invoice.invoiceNumber} - Sales revenue`
      });
    }

    // Credit Sales Tax Liability for tax amount
    if (invoice.taxAmount > 0 && taxAccount) {
      lines.push({
        accountId: taxAccount._id,
        accountCode: taxAccount.accountCode,
        accountName: taxAccount.accountName,
        debit: 0,
        credit: invoice.taxAmount,
        description: `Invoice ${invoice.invoiceNumber} - Sales tax`
      });
    } else if (invoice.taxAmount > 0 && !taxAccount) {
      // If no tax account found, credit sales instead
      lines[lines.length - 1].credit += invoice.taxAmount;
    }

    const journalEntry = new JournalEntry({
      companyId,
      entryDate: new Date(),
      referenceNumber: invoice.invoiceNumber,
      description: `Automatic entry for Invoice ${invoice.invoiceNumber}`,
      entryType: JournalEntryType.AUTO_INVOICE,
      status: JournalEntryStatus.POSTED,
      lines,
      totalDebit: invoice.totalAmount,
      totalCredit: invoice.totalAmount,
      postedBy: userId,
      createdBy: userId
    });

    const savedEntry = await journalEntry.save();
    return savedEntry._id;
  }

  /**
   * Create journal entry for a bill (double-entry bookkeeping)
   * Debit: Expense accounts (from line items)
   * Credit: Accounts Payable (liability account)
   * Credit: Input Tax Credit (if applicable)
   */
  static async createBillJournalEntry(
    bill: IBill,
    userId: mongoose.Types.ObjectId
  ): Promise<mongoose.Types.ObjectId> {
    const companyId = bill.companyId;
    
    // Get default Accounts Payable account
    const apAccount = await Account.findOne({
      companyId,
      accountType: "Liability",
      $or: [
        { accountName: /Accounts Payable/i },
        { accountName: /Trade Creditors/i },
        { subType: "Accounts Payable" }
      ]
    });

    if (!apAccount) {
      throw new Error("Accounts Payable account not found. Please set up your chart of accounts.");
    }

    // Get default Expense account
    const expenseAccount = await Account.findOne({
      companyId,
      accountType: "Expense",
      $or: [
        { accountName: /General Expenses/i },
        { accountName: /Operating Expenses/i },
        { accountName: /Cost of Goods Sold/i }
      ]
    });

    if (!expenseAccount) {
      throw new Error("Expense account not found. Please set up your chart of accounts.");
    }

    // Get Input Tax Credit account
    const itcAccount = await Account.findOne({
      companyId,
      accountType: "Asset",
      $or: [
        { accountName: /Input Tax Credit/i },
        { accountName: /VAT Input/i },
        { accountName: /GST Input/i }
      ]
    });

    const lines: JournalEntryLineInput[] = [];

    // Group line items by account
    const accountGroups = new Map<string, {
      accountId: mongoose.Types.ObjectId;
      accountCode: string;
      accountName: string;
      totalAmount: number;
    }>();

    // Process line items
    for (const lineItem of bill.lineItems) {
      let account = await Account.findById(lineItem.accountId);
      
      // If no specific account found, use default expense account
      if (!account || account.accountType !== "Expense") {
        account = expenseAccount;
      }

      const key = account._id.toString();
      if (accountGroups.has(key)) {
        accountGroups.get(key)!.totalAmount += lineItem.amount;
      } else {
        accountGroups.set(key, {
          accountId: account._id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          totalAmount: lineItem.amount
        });
      }
    }

    // Create debit lines for expense accounts
    for (const [_, accountInfo] of accountGroups) {
      lines.push({
        accountId: accountInfo.accountId,
        accountCode: accountInfo.accountCode,
        accountName: accountInfo.accountName,
        debit: accountInfo.totalAmount,
        credit: 0,
        description: `Bill ${bill.billNumber} - ${accountInfo.accountName}`
      });
    }

    // Credit Accounts Payable for the total amount
    lines.push({
      accountId: apAccount._id,
      accountCode: apAccount.accountCode,
      accountName: apAccount.accountName,
      debit: 0,
      credit: bill.totalAmount,
      description: `Bill ${bill.billNumber} - ${bill.supplierId?.toString() || 'Supplier'}`
    });

    const journalEntry = new JournalEntry({
      companyId,
      entryDate: new Date(),
      referenceNumber: bill.billNumber,
      description: `Automatic entry for Bill ${bill.billNumber}`,
      entryType: JournalEntryType.AUTO_BILL,
      status: JournalEntryStatus.POSTED,
      lines,
      totalDebit: bill.totalAmount,
      totalCredit: bill.totalAmount,
      postedBy: userId,
      createdBy: userId
    });

    const savedEntry = await journalEntry.save();
    return savedEntry._id;
  }

  /**
   * Create journal entry for a payment (double-entry bookkeeping)
   * For Invoice Payment:
   * Debit: Cash/Bank account
   * Credit: Accounts Receivable
   * 
   * For Bill Payment:
   * Debit: Accounts Payable
   * Credit: Cash/Bank account
   */
  static async createPaymentJournalEntry(
    paymentAmount: number,
    referenceNumber: string,
    description: string,
    cashAccountId: mongoose.Types.ObjectId,
    receivablePayableAccountId: mongoose.Types.ObjectId,
    companyId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    isInvoicePayment: boolean = true
  ): Promise<mongoose.Types.ObjectId> {
    const cashAccount = await Account.findById(cashAccountId);
    const arApAccount = await Account.findById(receivablePayableAccountId);

    if (!cashAccount || !arApAccount) {
      throw new Error("Required accounts not found for payment journal entry.");
    }

    const lines: JournalEntryLineInput[] = [];

    if (isInvoicePayment) {
      // Invoice payment: Debit Cash, Credit Accounts Receivable
      lines.push({
        accountId: cashAccount._id,
        accountCode: cashAccount.accountCode,
        accountName: cashAccount.accountName,
        debit: paymentAmount,
        credit: 0,
        description: `Payment received - ${referenceNumber}`
      });

      lines.push({
        accountId: arApAccount._id,
        accountCode: arApAccount.accountCode,
        accountName: arApAccount.accountName,
        debit: 0,
        credit: paymentAmount,
        description: `Payment received - ${referenceNumber}`
      });
    } else {
      // Bill payment: Debit Accounts Payable, Credit Cash
      lines.push({
        accountId: arApAccount._id,
        accountCode: arApAccount.accountCode,
        accountName: arApAccount.accountName,
        debit: paymentAmount,
        credit: 0,
        description: `Payment made - ${referenceNumber}`
      });

      lines.push({
        accountId: cashAccount._id,
        accountCode: cashAccount.accountCode,
        accountName: cashAccount.accountName,
        debit: 0,
        credit: paymentAmount,
        description: `Payment made - ${referenceNumber}`
      });
    }

    const journalEntry = new JournalEntry({
      companyId,
      entryDate: new Date(),
      referenceNumber,
      description: description || `Automatic entry for payment ${referenceNumber}`,
      entryType: JournalEntryType.AUTO_PAYMENT,
      status: JournalEntryStatus.POSTED,
      lines,
      totalDebit: paymentAmount,
      totalCredit: paymentAmount,
      postedBy: userId,
      createdBy: userId
    });

    const savedEntry = await journalEntry.save();
    return savedEntry._id;
  }

  /**
   * Get default cash/bank account for a company
   */
  static async getDefaultCashAccount(companyId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId> {
    const cashAccount = await Account.findOne({
      companyId,
      accountType: "Asset",
      $or: [
        { accountName: /Cash/i },
        { accountName: /Bank/i },
        { accountName: /Checking/i },
        { subType: "Cash" },
        { subType: "Bank" }
      ]
    });

    if (!cashAccount) {
      throw new Error("Cash/Bank account not found. Please set up your chart of accounts.");
    }

    return cashAccount._id;
  }

  /**
   * Get default accounts receivable account for a company
   */
  static async getAccountsReceivableAccount(companyId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId> {
    const arAccount = await Account.findOne({
      companyId,
      accountType: "Asset",
      $or: [
        { accountName: /Accounts Receivable/i },
        { accountName: /Trade Debtors/i },
        { subType: "Accounts Receivable" }
      ]
    });

    if (!arAccount) {
      throw new Error("Accounts Receivable account not found. Please set up your chart of accounts.");
    }

    return arAccount._id;
  }

  /**
   * Get default accounts payable account for a company
   */
  static async getAccountsPayableAccount(companyId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId> {
    const apAccount = await Account.findOne({
      companyId,
      accountType: "Liability",
      $or: [
        { accountName: /Accounts Payable/i },
        { accountName: /Trade Creditors/i },
        { subType: "Accounts Payable" }
      ]
    });

    if (!apAccount) {
      throw new Error("Accounts Payable account not found. Please set up your chart of accounts.");
    }

    return apAccount._id;
  }
}