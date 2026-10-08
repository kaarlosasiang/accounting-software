import mongoose, { ClientSession } from "mongoose";

import logger from "../config/logger.js";
import Account from "../models/Account.js";
import { AccountingPeriod } from "../models/AccountingPeriod.js";
import { Customer } from "../models/Customer.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Ledger } from "../models/Ledger.js";
import { round2 } from "../shared/helpers/money.js";
import { PeriodStatus } from "../shared/interface/IAccountingPeriod.js";
import { IBill } from "../shared/interface/IBill.js";
import { IInvoice } from "../shared/interface/IInvoice.js";
import {
  IJournalEntryDocument,
  IJournalEntryLine,
  JournalEntryStatus,
  JournalEntryType,
} from "../shared/interface/IJournalEntry.js";

import {
  findSystemAccount,
  requireSystemAccount,
  ResolvedAccount,
  SystemAccount,
} from "./accountResolver.js";

type ObjectIdLike = mongoose.Types.ObjectId | string;

const toObjectId = (id: ObjectIdLike) =>
  new mongoose.Types.ObjectId(String(id));

/** A line as supplied by callers: account + amounts (description optional). */
export interface PostingLineInput {
  accountId: ObjectIdLike;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface PostEntryParams {
  companyId: ObjectIdLike;
  userId: ObjectIdLike;
  entryDate: Date;
  entryType: JournalEntryType;
  lines: PostingLineInput[];
  description?: string;
  referenceNumber?: string;
  isClosingEntry?: boolean;
  sourceType?: "Invoice" | "Bill" | "Payment" | "Period";
  sourceId?: ObjectIdLike;
  reversalOfEntryId?: ObjectIdLike;
  /** Allow posting to archived accounts (used when reversing old entries). */
  allowInactiveAccounts?: boolean;
  session?: ClientSession | null;
}

const isDebitNormal = (accountType: string) =>
  accountType === "Asset" || accountType === "Expense";

/**
 * Journal Entry Service — the single posting engine.
 *
 * Every automatic or manual posting goes through `postEntry` /
 * `postDraftEntry`, which validate the entry and write the journal entry and
 * its ledger rows inside the caller's MongoDB session, so a failed business
 * operation can never leave orphaned GL postings behind. Voids go through
 * `reverseEntry`, which posts a reversing entry and marks the original void.
 */
export class JournalEntryService {
  // ─── Validation helpers ────────────────────────────────────────────────────

  /**
   * Throw if the date falls in a closed or locked accounting period.
   * Closing entries are exempt (they post into the period being closed).
   */
  static async validatePeriodNotClosed(
    companyId: ObjectIdLike,
    transactionDate: Date,
    isClosingEntry: boolean = false,
    session?: ClientSession | null,
  ): Promise<void> {
    if (isClosingEntry) return;

    const period = await AccountingPeriod.findOne({
      companyId: toObjectId(companyId),
      startDate: { $lte: transactionDate },
      endDate: { $gte: transactionDate },
      status: { $in: [PeriodStatus.CLOSED, PeriodStatus.LOCKED] },
    }).session(session ?? null);

    if (period) {
      throw new Error(
        `Cannot post transaction to ${period.status} period "${period.periodName}" ` +
          `(${period.startDate.toISOString().split("T")[0]} to ${period.endDate.toISOString().split("T")[0]}). ` +
          `Please reopen the period or change the transaction date.`,
      );
    }
  }

  /**
   * Resolve and validate posting lines: every account must exist in the
   * company (and be active unless `allowInactive`), amounts are rounded to
   * cents and must be non-negative, and lines with zero amounts are dropped.
   */
  static async buildLines(
    companyId: ObjectIdLike,
    inputs: PostingLineInput[],
    options: { allowInactive?: boolean; session?: ClientSession | null } = {},
  ): Promise<IJournalEntryLine[]> {
    const accountIds = [
      ...new Set(inputs.map((line) => String(line.accountId))),
    ];
    for (const id of accountIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid account id: ${id}`);
      }
    }

    const accounts = await Account.find({
      _id: { $in: accountIds.map(toObjectId) },
      companyId: toObjectId(companyId),
    })
      .session(options.session ?? null)
      .lean();
    const byId = new Map(accounts.map((a) => [a._id.toString(), a]));

    const lines: IJournalEntryLine[] = [];
    for (const input of inputs) {
      const account = byId.get(String(input.accountId));
      if (!account) {
        throw new Error(`Account not found: ${input.accountId}`);
      }
      if (account.isActive === false && !options.allowInactive) {
        throw new Error(
          `Account ${account.accountCode} - ${account.accountName} is archived`,
        );
      }

      const debit = round2(Number(input.debit) || 0);
      const credit = round2(Number(input.credit) || 0);
      if (debit < 0 || credit < 0) {
        throw new Error("Debit and credit amounts cannot be negative");
      }
      if (debit === 0 && credit === 0) continue;

      lines.push({
        accountId: account._id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        debit,
        credit,
        description: input.description ?? "",
      });
    }

    return lines;
  }

  // ─── Posting ───────────────────────────────────────────────────────────────

  /**
   * Create a POSTED journal entry and its ledger rows atomically (within the
   * supplied session).
   */
  static async postEntry(
    params: PostEntryParams,
  ): Promise<IJournalEntryDocument> {
    const session = params.session ?? null;

    await this.validatePeriodNotClosed(
      params.companyId,
      params.entryDate,
      params.isClosingEntry ?? false,
      session,
    );

    const lines = await this.buildLines(params.companyId, params.lines, {
      allowInactive: params.allowInactiveAccounts,
      session,
    });

    const entry = new JournalEntry({
      companyId: toObjectId(params.companyId),
      entryDate: params.entryDate,
      referenceNumber: params.referenceNumber,
      description: params.description,
      entryType: params.entryType,
      status: JournalEntryStatus.POSTED,
      lines,
      isClosingEntry: params.isClosingEntry ?? false,
      sourceType: params.sourceType ?? null,
      sourceId: params.sourceId ? toObjectId(params.sourceId) : null,
      reversalOfEntryId: params.reversalOfEntryId
        ? toObjectId(params.reversalOfEntryId)
        : null,
      postedBy: toObjectId(params.userId),
      createdBy: toObjectId(params.userId),
    });

    await entry.save({ session: session ?? undefined });
    await this.writeLedgerRows(entry, session);

    return entry;
  }

  /**
   * Post an existing DRAFT journal entry (manual entries are created as
   * drafts and posted later).
   */
  static async postDraftEntry(
    entry: IJournalEntryDocument,
    userId: ObjectIdLike,
    session?: ClientSession | null,
  ): Promise<IJournalEntryDocument> {
    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new Error("Only draft entries can be posted");
    }

    await this.validatePeriodNotClosed(
      entry.companyId,
      entry.entryDate,
      entry.isClosingEntry ?? false,
      session,
    );

    // Re-validate accounts at posting time (they may have been archived or
    // deleted since the draft was saved).
    entry.lines = await this.buildLines(
      entry.companyId,
      entry.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
      })),
      { session },
    );

    entry.status = JournalEntryStatus.POSTED;
    entry.postedBy = toObjectId(userId);
    await entry.save({ session: session ?? undefined });
    await this.writeLedgerRows(entry, session);

    return entry;
  }

  /**
   * Write one ledger row per journal entry line.
   *
   * `runningBalance` is informational (balance after this row at insertion
   * time); all balance computations aggregate debit/credit instead because a
   * stored running balance goes stale as soon as an entry is back-dated.
   */
  static async writeLedgerRows(
    entry: IJournalEntryDocument,
    session?: ClientSession | null,
  ): Promise<void> {
    const accountIds = [
      ...new Set(entry.lines.map((l) => l.accountId.toString())),
    ].map(toObjectId);

    const [accounts, priorTotals] = await Promise.all([
      Account.find({ _id: { $in: accountIds } })
        .select("accountType")
        .session(session ?? null)
        .lean(),
      Ledger.aggregate([
        {
          $match: {
            companyId: entry.companyId,
            accountId: { $in: accountIds },
            transactionDate: { $lte: entry.entryDate },
          },
        },
        {
          $group: {
            _id: "$accountId",
            debit: { $sum: { $toDouble: "$debit" } },
            credit: { $sum: { $toDouble: "$credit" } },
          },
        },
      ]).session(session ?? null),
    ]);

    const typeById = new Map(
      accounts.map((a) => [a._id.toString(), a.accountType as string]),
    );
    const balanceById = new Map<string, number>();
    for (const row of priorTotals) {
      const type = typeById.get(row._id.toString()) ?? "Asset";
      balanceById.set(
        row._id.toString(),
        round2(
          isDebitNormal(type) ? row.debit - row.credit : row.credit - row.debit,
        ),
      );
    }

    const rows = entry.lines.map((line) => {
      const key = line.accountId.toString();
      const type = typeById.get(key) ?? "Asset";
      const change = isDebitNormal(type)
        ? line.debit - line.credit
        : line.credit - line.debit;
      const runningBalance = round2((balanceById.get(key) ?? 0) + change);
      balanceById.set(key, runningBalance);

      return {
        companyId: entry.companyId,
        accountId: line.accountId,
        accountName: line.accountName,
        journalEntryId: entry._id,
        entryNumber: entry.entryNumber,
        transactionDate: entry.entryDate,
        description:
          line.description ||
          entry.description ||
          entry.referenceNumber ||
          `Journal entry ${entry.entryNumber}`,
        debit: line.debit,
        credit: line.credit,
        runningBalance,
        entryType: entry.entryType,
        isClosingEntry: entry.isClosingEntry ?? false,
      };
    });

    await Ledger.insertMany(rows, { session: session ?? undefined });
  }

  // ─── Reversal / void ───────────────────────────────────────────────────────

  /**
   * Void a posted journal entry by posting a reversing entry (debits and
   * credits swapped) and marking the original VOID.
   *
   * @param date  Date of the reversing entry (defaults to now). It must fall
   *              in an open period.
   */
  static async reverseEntry(params: {
    companyId: ObjectIdLike;
    journalEntryId: ObjectIdLike;
    userId: ObjectIdLike;
    date?: Date;
    reason?: string;
    session?: ClientSession | null;
  }): Promise<{
    originalEntry: IJournalEntryDocument;
    reversingEntry: IJournalEntryDocument;
  }> {
    const session = params.session ?? null;

    const originalEntry = await JournalEntry.findOne({
      _id: toObjectId(params.journalEntryId),
      companyId: toObjectId(params.companyId),
    }).session(session);

    if (!originalEntry) {
      throw new Error("Journal entry not found");
    }
    if (originalEntry.status === JournalEntryStatus.VOID) {
      throw new Error("Journal entry is already voided");
    }
    if (originalEntry.status !== JournalEntryStatus.POSTED) {
      throw new Error("Only posted entries can be voided");
    }

    const reversalDate = params.date ?? new Date();
    const reversingEntry = await this.postEntry({
      companyId: originalEntry.companyId,
      userId: params.userId,
      entryDate: reversalDate,
      entryType: originalEntry.entryType,
      referenceNumber: `REV-${originalEntry.entryNumber}`,
      description:
        `Reversal of ${originalEntry.entryNumber}` +
        (params.reason ? ` (${params.reason})` : "") +
        (originalEntry.description ? `: ${originalEntry.description}` : ""),
      lines: originalEntry.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.credit,
        credit: line.debit,
        description: `Reversal: ${line.description ?? ""}`.trim(),
      })),
      // A reversal of a closing entry is itself a closing-type entry so it is
      // excluded from the income statement just like the original.
      isClosingEntry: originalEntry.isClosingEntry ?? false,
      sourceType: originalEntry.sourceType ?? undefined,
      sourceId: originalEntry.sourceId ?? undefined,
      reversalOfEntryId: originalEntry._id,
      allowInactiveAccounts: true,
      session,
    });

    originalEntry.status = JournalEntryStatus.VOID;
    originalEntry.voidedAt = new Date();
    originalEntry.voidedBy = toObjectId(params.userId);
    originalEntry.reversedByEntryId = reversingEntry._id as any;
    await originalEntry.save({ session: session ?? undefined });

    logger.info("Journal entry reversed", {
      originalEntryId: originalEntry._id,
      reversingEntryId: reversingEntry._id,
      companyId: String(params.companyId),
    });

    return { originalEntry, reversingEntry };
  }

  /**
   * Backwards-compatible wrapper: void with a reversal dated today.
   */
  static async voidJournalEntry(
    companyId: string,
    journalEntryId: string,
    userId: string,
    session?: ClientSession,
  ) {
    return this.reverseEntry({ companyId, journalEntryId, userId, session });
  }

  /**
   * Create and post a journal entry from string amounts (used by period
   * closing). Now posts to the ledger as well — previously closing entries
   * were saved as POSTED but never reached the ledger.
   */
  static async createJournalEntry(
    companyId: string,
    userId: string,
    entryData: {
      transactionDate: Date;
      description?: string;
      referenceNumber?: string;
      entries: Array<{
        accountId: string;
        debit: string | number;
        credit: string | number;
        description?: string;
      }>;
      notes?: string;
      isClosingEntry?: boolean;
      sourceType?: "Period";
      sourceId?: ObjectIdLike;
    },
    session?: ClientSession,
  ) {
    return this.postEntry({
      companyId,
      userId,
      entryDate: entryData.transactionDate,
      entryType: JournalEntryType.MANUAL,
      description: entryData.description,
      referenceNumber: entryData.referenceNumber,
      isClosingEntry: entryData.isClosingEntry ?? false,
      sourceType: entryData.sourceType,
      sourceId: entryData.sourceId,
      lines: entryData.entries.map((e) => ({
        accountId: e.accountId,
        debit: parseFloat(String(e.debit)) || 0,
        credit: parseFloat(String(e.credit)) || 0,
        description: e.description || entryData.description || "",
      })),
      session,
    });
  }

  // ─── Document postings ─────────────────────────────────────────────────────

  /**
   * Post an invoice.
   *
   *   Dr Accounts Receivable          total
   *   Dr Sales Discounts              discount   (if a discount account exists)
   *      Cr Revenue (per line account)   line amounts (net of discount if no
   *                                      discount account)
   *      Cr Sales Tax / Output VAT       tax
   *   Dr COGS / Cr Inventory          cost of product lines (at unit cost)
   */
  static async createInvoiceJournalEntry(
    invoice: IInvoice,
    userId: ObjectIdLike,
    session?: ClientSession | null,
  ): Promise<mongoose.Types.ObjectId> {
    const companyId = invoice.companyId;
    const entryDate = invoice.invoiceDate ?? new Date();

    const arAccount = await requireSystemAccount(
      companyId,
      SystemAccount.ACCOUNTS_RECEIVABLE,
      session,
    );

    const customerName = await this.resolveCustomerName(invoice, session);
    const ref = `Invoice ${invoice.invoiceNumber}`;

    // Revenue: credit each line's own revenue account, falling back to the
    // default sales account when the line's account is not a revenue account
    // of this company.
    const lineAccountIds = invoice.lineItems
      .map((item) => item.accountId)
      .filter(Boolean)
      .map((id) => toObjectId(id as any));
    const revenueAccounts = await Account.find({
      _id: { $in: lineAccountIds },
      companyId,
      accountType: "Revenue",
      isActive: { $ne: false },
    })
      .session(session ?? null)
      .lean();
    const revenueIds = new Set(revenueAccounts.map((a) => a._id.toString()));

    let defaultSales: ResolvedAccount | null = null;
    const revenueByAccount = new Map<string, number>();
    for (const item of invoice.lineItems) {
      let accountId = item.accountId ? String(item.accountId) : "";
      if (!revenueIds.has(accountId)) {
        defaultSales ??= await requireSystemAccount(
          companyId,
          SystemAccount.SALES,
          session,
        );
        accountId = defaultSales._id.toString();
      }
      revenueByAccount.set(
        accountId,
        round2((revenueByAccount.get(accountId) ?? 0) + (item.amount || 0)),
      );
    }

    const lines: PostingLineInput[] = [
      {
        accountId: arAccount._id,
        debit: invoice.totalAmount,
        description: `${ref} - ${customerName || "Customer"}`,
      },
    ];

    // Discount: book to the Sales Discounts contra account when available,
    // otherwise net it against revenue.
    const discount = round2(invoice.discount || 0);
    if (discount > 0) {
      const discountAccount = await findSystemAccount(
        companyId,
        SystemAccount.SALES_DISCOUNT,
        session,
      );
      if (discountAccount) {
        lines.push({
          accountId: discountAccount._id,
          debit: discount,
          description: `${ref} - Discount`,
        });
      } else {
        this.reduceLargest(revenueByAccount, discount);
      }
    }

    for (const [accountId, amount] of revenueByAccount) {
      if (amount > 0) {
        lines.push({
          accountId,
          credit: amount,
          description: `${ref} - Sales revenue`,
        });
      } else if (amount < 0) {
        lines.push({
          accountId,
          debit: -amount,
          description: `${ref} - Sales revenue`,
        });
      }
    }

    // Tax: credit Output VAT / Sales Tax; fold into revenue only when the
    // company has no tax liability account at all.
    const taxAmount = round2(invoice.taxAmount || 0);
    if (taxAmount > 0) {
      const taxAccount = await findSystemAccount(
        companyId,
        SystemAccount.SALES_TAX,
        session,
      );
      if (taxAccount) {
        lines.push({
          accountId: taxAccount._id,
          credit: taxAmount,
          description: `${ref} - Sales tax`,
        });
      } else {
        logger.warn(
          "No sales tax liability account found; tax credited to revenue",
          {
            companyId: String(companyId),
            invoiceNumber: invoice.invoiceNumber,
          },
        );
        const salesId = (
          defaultSales ??
          (await requireSystemAccount(companyId, SystemAccount.SALES, session))
        )._id;
        lines.push({
          accountId: salesId,
          credit: taxAmount,
          description: `${ref} - Sales tax`,
        });
      }
    }

    lines.push(...(await this.buildCogsLines(invoice, ref, session)));

    const entry = await this.postEntry({
      companyId,
      userId,
      entryDate,
      entryType: JournalEntryType.AUTO_INVOICE,
      referenceNumber: invoice.invoiceNumber,
      description: `Automatic entry for ${ref}`,
      lines,
      sourceType: "Invoice",
      sourceId: (invoice as any)._id,
      session,
    });
    return entry._id as mongoose.Types.ObjectId;
  }

  /**
   * Cost-of-goods-sold lines for product line items: Dr COGS / Cr Inventory
   * at the item's unit cost.
   */
  private static async buildCogsLines(
    invoice: IInvoice,
    ref: string,
    session?: ClientSession | null,
  ): Promise<PostingLineInput[]> {
    const productLines = invoice.lineItems.filter(
      (item) => item.inventoryItemId,
    );
    if (productLines.length === 0) return [];

    type CostedItem = {
      _id: mongoose.Types.ObjectId;
      unitCost?: number;
      cogsAccountId?: mongoose.Types.ObjectId;
      inventoryAccountId?: mongoose.Types.ObjectId;
    };
    const items = (await InventoryItem.find({
      _id: {
        $in: productLines.map((l) => toObjectId(l.inventoryItemId as any)),
      },
      companyId: invoice.companyId,
      itemType: "Product",
    })
      .session(session ?? null)
      .lean()) as unknown as CostedItem[];
    const itemById = new Map(items.map((i) => [i._id.toString(), i]));

    const cogsByAccount = new Map<string, number>();
    const inventoryByAccount = new Map<string, number>();
    let defaultCogs: ResolvedAccount | null | undefined;
    let defaultInventory: ResolvedAccount | null | undefined;

    for (const line of productLines) {
      const item = itemById.get(String(line.inventoryItemId));
      if (!item) continue;
      const cost = round2((item.unitCost || 0) * (line.quantity || 0));
      if (cost <= 0) continue;

      let cogsId = item.cogsAccountId ? String(item.cogsAccountId) : "";
      if (!cogsId) {
        if (defaultCogs === undefined) {
          defaultCogs = await findSystemAccount(
            invoice.companyId,
            SystemAccount.COGS,
            session,
          );
        }
        cogsId = defaultCogs?._id.toString() ?? "";
      }
      let inventoryId = item.inventoryAccountId
        ? String(item.inventoryAccountId)
        : "";
      if (!inventoryId) {
        if (defaultInventory === undefined) {
          defaultInventory = await findSystemAccount(
            invoice.companyId,
            SystemAccount.INVENTORY,
            session,
          );
        }
        inventoryId = defaultInventory?._id.toString() ?? "";
      }

      if (!cogsId || !inventoryId) {
        logger.warn("COGS not posted: missing COGS or Inventory account", {
          companyId: String(invoice.companyId),
          inventoryItemId: String(line.inventoryItemId),
        });
        continue;
      }

      cogsByAccount.set(
        cogsId,
        round2((cogsByAccount.get(cogsId) ?? 0) + cost),
      );
      inventoryByAccount.set(
        inventoryId,
        round2((inventoryByAccount.get(inventoryId) ?? 0) + cost),
      );
    }

    const lines: PostingLineInput[] = [];
    for (const [accountId, amount] of cogsByAccount) {
      lines.push({
        accountId,
        debit: amount,
        description: `${ref} - Cost of goods sold`,
      });
    }
    for (const [accountId, amount] of inventoryByAccount) {
      lines.push({
        accountId,
        credit: amount,
        description: `${ref} - Inventory relieved`,
      });
    }
    return lines;
  }

  /**
   * Post a bill.
   *
   *   Dr Expense / Inventory (per line account)   line amounts
   *   Dr Input VAT                                tax (folded into the
   *                                               expense lines if no input
   *                                               tax account exists)
   *      Cr Purchase Discounts                    discount (or net against
   *                                               the expense lines)
   *      Cr Accounts Payable                      total
   */
  static async createBillJournalEntry(
    bill: IBill,
    userId: ObjectIdLike,
    session?: ClientSession | null,
  ): Promise<mongoose.Types.ObjectId> {
    const companyId = bill.companyId;
    const entryDate = bill.billDate ?? bill.createdAt ?? new Date();
    const ref = `Bill ${bill.billNumber}`;

    const apAccount = await requireSystemAccount(
      companyId,
      SystemAccount.ACCOUNTS_PAYABLE,
      session,
    );

    // Bill lines may point at expense accounts or inventory/asset accounts.
    const lineAccountIds = bill.lineItems
      .map((item) => item.accountId)
      .filter(Boolean)
      .map((id) => toObjectId(id as any));
    const validAccounts = await Account.find({
      _id: { $in: lineAccountIds },
      companyId,
      accountType: { $in: ["Expense", "Asset"] },
      isActive: { $ne: false },
    })
      .session(session ?? null)
      .lean();
    const validIds = new Set(validAccounts.map((a) => a._id.toString()));

    // Purchases of stocked products must increase the Inventory account the
    // item is tracked in, whatever account was picked on the line —
    // otherwise on-hand quantity and the GL inventory balance drift apart.
    const productIds = bill.lineItems
      .map((item) => item.inventoryItemId)
      .filter(Boolean)
      .map((id) => toObjectId(id as any));
    const products = productIds.length
      ? ((await InventoryItem.find({
          _id: { $in: productIds },
          companyId,
          itemType: "Product",
        })
          .select("inventoryAccountId")
          .session(session ?? null)
          .lean()) as unknown as Array<{
          _id: mongoose.Types.ObjectId;
          inventoryAccountId?: mongoose.Types.ObjectId;
        }>)
      : [];
    const inventoryAccountByItem = new Map<string, string>();
    let defaultInventory: ResolvedAccount | null | undefined;
    for (const product of products) {
      let accountId = product.inventoryAccountId
        ? String(product.inventoryAccountId)
        : "";
      if (!accountId) {
        if (defaultInventory === undefined) {
          defaultInventory = await findSystemAccount(
            companyId,
            SystemAccount.INVENTORY,
            session,
          );
        }
        accountId = defaultInventory?._id.toString() ?? "";
      }
      if (accountId)
        inventoryAccountByItem.set(product._id.toString(), accountId);
    }

    let defaultExpense: ResolvedAccount | null = null;
    const debitByAccount = new Map<string, number>();
    for (const item of bill.lineItems) {
      let accountId = item.accountId ? String(item.accountId) : "";
      const inventoryAccount = item.inventoryItemId
        ? inventoryAccountByItem.get(String(item.inventoryItemId))
        : undefined;
      if (inventoryAccount) {
        accountId = inventoryAccount;
      } else if (!validIds.has(accountId)) {
        defaultExpense ??= await requireSystemAccount(
          companyId,
          SystemAccount.DEFAULT_EXPENSE,
          session,
        );
        accountId = defaultExpense._id.toString();
      }
      debitByAccount.set(
        accountId,
        round2((debitByAccount.get(accountId) ?? 0) + (item.amount || 0)),
      );
    }

    const lines: PostingLineInput[] = [];

    const taxAmount = round2(bill.taxAmount || 0);
    if (taxAmount > 0) {
      const inputTax = await findSystemAccount(
        companyId,
        SystemAccount.INPUT_TAX,
        session,
      );
      if (inputTax) {
        lines.push({
          accountId: inputTax._id,
          debit: taxAmount,
          description: `${ref} - Input tax`,
        });
      } else {
        // Non-recoverable tax becomes part of the cost.
        this.reduceLargest(debitByAccount, -taxAmount);
      }
    }

    const discount = round2(bill.discount || 0);
    if (discount > 0) {
      const purchaseDiscount = await findSystemAccount(
        companyId,
        SystemAccount.PURCHASE_DISCOUNT,
        session,
      );
      if (purchaseDiscount) {
        lines.push({
          accountId: purchaseDiscount._id,
          credit: discount,
          description: `${ref} - Discount`,
        });
      } else {
        this.reduceLargest(debitByAccount, discount);
      }
    }

    for (const [accountId, amount] of debitByAccount) {
      if (amount > 0) {
        lines.push({ accountId, debit: amount, description: `${ref}` });
      } else if (amount < 0) {
        lines.push({ accountId, credit: -amount, description: `${ref}` });
      }
    }

    lines.push({
      accountId: apAccount._id,
      credit: bill.totalAmount,
      description: `${ref} - Accounts payable`,
    });

    const entry = await this.postEntry({
      companyId,
      userId,
      entryDate,
      entryType: JournalEntryType.AUTO_BILL,
      referenceNumber: bill.billNumber,
      description: `Automatic entry for ${ref}`,
      lines,
      sourceType: "Bill",
      sourceId: (bill as any)._id,
      session,
    });
    return entry._id as mongoose.Types.ObjectId;
  }

  /**
   * Post a payment.
   *   Received: Dr Cash/Bank, Cr Accounts Receivable
   *   Made:     Dr Accounts Payable, Cr Cash/Bank
   */
  static async createPaymentJournalEntry(params: {
    amount: number;
    paymentDate: Date;
    referenceNumber: string;
    description: string;
    cashAccountId: ObjectIdLike;
    receivablePayableAccountId: ObjectIdLike;
    companyId: ObjectIdLike;
    userId: ObjectIdLike;
    isInvoicePayment: boolean;
    paymentId?: ObjectIdLike;
    session?: ClientSession | null;
  }): Promise<mongoose.Types.ObjectId> {
    const amount = round2(params.amount);
    const verb = params.isInvoicePayment ? "received" : "made";
    const lineDescription = `Payment ${verb} - ${params.referenceNumber}`;

    const lines: PostingLineInput[] = params.isInvoicePayment
      ? [
          {
            accountId: params.cashAccountId,
            debit: amount,
            description: lineDescription,
          },
          {
            accountId: params.receivablePayableAccountId,
            credit: amount,
            description: lineDescription,
          },
        ]
      : [
          {
            accountId: params.receivablePayableAccountId,
            debit: amount,
            description: lineDescription,
          },
          {
            accountId: params.cashAccountId,
            credit: amount,
            description: lineDescription,
          },
        ];

    const entry = await this.postEntry({
      companyId: params.companyId,
      userId: params.userId,
      entryDate: params.paymentDate,
      entryType: JournalEntryType.AUTO_PAYMENT,
      referenceNumber: params.referenceNumber,
      description:
        params.description ||
        `Automatic entry for payment ${params.referenceNumber}`,
      lines,
      sourceType: "Payment",
      sourceId: params.paymentId,
      session: params.session,
    });
    return entry._id as mongoose.Types.ObjectId;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Subtract `amount` from the largest value in the map (a negative amount
   * adds to it). Used to net discounts/tax into line amounts.
   */
  private static reduceLargest(map: Map<string, number>, amount: number) {
    let largestKey: string | null = null;
    for (const [key, value] of map) {
      if (largestKey === null || value > (map.get(largestKey) ?? 0)) {
        largestKey = key;
      }
    }
    if (largestKey !== null) {
      map.set(largestKey, round2((map.get(largestKey) ?? 0) - amount));
    }
  }

  private static async resolveCustomerName(
    invoice: IInvoice,
    session?: ClientSession | null,
  ): Promise<string | undefined> {
    const customerRef = invoice.customerId as any;
    const populatedName = customerRef?.customerName || customerRef?.displayName;
    if (populatedName) return populatedName;

    const customer = await Customer.findOne({
      _id: customerRef?._id || customerRef,
      companyId: invoice.companyId,
    })
      .select("customerName displayName")
      .session(session ?? null)
      .lean();
    return customer?.customerName || customer?.displayName;
  }

  /** @deprecated use requireSystemAccount(companyId, SystemAccount.CASH) */
  static async getDefaultCashAccount(
    companyId: mongoose.Types.ObjectId,
  ): Promise<mongoose.Types.ObjectId> {
    return (await requireSystemAccount(companyId, SystemAccount.CASH))._id;
  }

  static async getAccountsReceivableAccount(
    companyId: ObjectIdLike,
    session?: ClientSession | null,
  ): Promise<mongoose.Types.ObjectId> {
    return (
      await requireSystemAccount(
        companyId,
        SystemAccount.ACCOUNTS_RECEIVABLE,
        session,
      )
    )._id;
  }

  static async getAccountsPayableAccount(
    companyId: ObjectIdLike,
    session?: ClientSession | null,
  ): Promise<mongoose.Types.ObjectId> {
    return (
      await requireSystemAccount(
        companyId,
        SystemAccount.ACCOUNTS_PAYABLE,
        session,
      )
    )._id;
  }
}
