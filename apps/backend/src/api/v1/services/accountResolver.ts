import mongoose, { ClientSession } from "mongoose";

import Account from "../models/Account.js";
import { IAccount } from "../shared/interface/IAccount.js";

/**
 * Deterministic lookup of the "system" accounts used by automatic postings.
 *
 * The previous implementation used loose name regexes with `findOne` and no
 * sort, which could pick the wrong account (e.g. `/Sales/i` matching the
 * "Sales Discounts" contra-revenue account, or `/Cash/i` matching "Petty
 * Cash"). Each role below is resolved by trying a list of increasingly
 * general criteria in order; within one criterion the lowest account code
 * wins, so the result is always the same for the same chart of accounts.
 */
export enum SystemAccount {
  CASH = "CASH",
  ACCOUNTS_RECEIVABLE = "ACCOUNTS_RECEIVABLE",
  ACCOUNTS_PAYABLE = "ACCOUNTS_PAYABLE",
  SALES = "SALES",
  SALES_TAX = "SALES_TAX",
  INPUT_TAX = "INPUT_TAX",
  SALES_DISCOUNT = "SALES_DISCOUNT",
  PURCHASE_DISCOUNT = "PURCHASE_DISCOUNT",
  COGS = "COGS",
  INVENTORY = "INVENTORY",
  INVENTORY_ADJUSTMENT = "INVENTORY_ADJUSTMENT",
  DEFAULT_EXPENSE = "DEFAULT_EXPENSE",
  RETAINED_EARNINGS = "RETAINED_EARNINGS",
}

type Criterion = Record<string, unknown>;

interface AccountRule {
  accountType: IAccount["accountType"];
  label: string;
  criteria: Criterion[];
}

const RULES: Record<SystemAccount, AccountRule> = {
  [SystemAccount.CASH]: {
    accountType: "Asset",
    label: "Cash/Bank",
    criteria: [
      { subType: { $in: ["Cash", "Bank"] } },
      { accountCode: "1010" },
      { accountCode: "1000" },
      { accountName: /^(cash in bank|cash on hand|cash|bank)$/i },
    ],
  },
  [SystemAccount.ACCOUNTS_RECEIVABLE]: {
    accountType: "Asset",
    label: "Accounts Receivable",
    criteria: [
      { subType: "Accounts Receivable" },
      { accountName: /^(accounts receivable|trade debtors)$/i },
      { accountCode: "1100" },
    ],
  },
  [SystemAccount.ACCOUNTS_PAYABLE]: {
    accountType: "Liability",
    label: "Accounts Payable",
    criteria: [
      { subType: "Accounts Payable" },
      { accountName: /^(accounts payable|trade creditors)$/i },
      { accountCode: "2000" },
    ],
  },
  [SystemAccount.SALES]: {
    accountType: "Revenue",
    label: "Sales/Revenue",
    criteria: [
      { accountName: /^(sales revenue|sales|revenue)$/i },
      { accountCode: "4000" },
      { subType: "Operating Revenue", normalBalance: "Credit" },
      { normalBalance: "Credit", subType: { $ne: "Contra Revenue" } },
    ],
  },
  [SystemAccount.SALES_TAX]: {
    accountType: "Liability",
    label: "Sales Tax / Output VAT",
    criteria: [
      { subType: "Sales Tax" },
      { accountName: /^(sales tax payable|output vat|vat payable)$/i },
      { accountName: /sales tax|output vat|output tax|gst payable/i },
    ],
  },
  [SystemAccount.INPUT_TAX]: {
    accountType: "Asset",
    label: "Input VAT / Input Tax Credit",
    criteria: [
      { subType: "Input Tax" },
      { accountName: /input vat|input tax|vat input|gst input/i },
    ],
  },
  [SystemAccount.SALES_DISCOUNT]: {
    accountType: "Revenue",
    label: "Sales Discounts",
    criteria: [
      { accountName: /^sales discounts?$/i },
      { accountName: /sales discount/i, normalBalance: "Debit" },
    ],
  },
  [SystemAccount.PURCHASE_DISCOUNT]: {
    accountType: "Expense",
    label: "Purchase Discounts",
    criteria: [
      { accountName: /^purchase discounts?$/i },
      { accountName: /purchase discount/i, normalBalance: "Credit" },
    ],
  },
  [SystemAccount.INVENTORY_ADJUSTMENT]: {
    accountType: "Expense",
    label: "Inventory Adjustment",
    criteria: [
      { accountName: /^inventory (adjustments?|shrinkage)$/i },
      { accountName: /inventory (adjustment|shrinkage)/i },
      { accountName: /^cost of goods sold$/i },
      { subType: "Cost of Sales", normalBalance: "Debit" },
    ],
  },
  [SystemAccount.COGS]: {
    accountType: "Expense",
    label: "Cost of Goods Sold",
    criteria: [
      { accountName: /^cost of goods sold$/i },
      { accountCode: "5000" },
      { subType: "Cost of Sales", normalBalance: "Debit" },
    ],
  },
  [SystemAccount.INVENTORY]: {
    accountType: "Asset",
    label: "Inventory",
    criteria: [
      { accountName: /^(inventory|merchandise inventory)$/i },
      { accountCode: "1200" },
    ],
  },
  [SystemAccount.DEFAULT_EXPENSE]: {
    accountType: "Expense",
    label: "General/Operating Expense",
    criteria: [
      {
        accountName:
          /^(general expenses?|operating expenses?|miscellaneous expenses?)$/i,
      },
      { subType: "Operating Expense", normalBalance: "Debit" },
      { normalBalance: "Debit" },
    ],
  },
  [SystemAccount.RETAINED_EARNINGS]: {
    accountType: "Equity",
    label: "Retained Earnings",
    criteria: [
      { accountName: /^retained earnings$/i },
      {
        subType: "Retained Earnings",
        accountName: { $not: /current year/i },
      },
    ],
  },
};

export type ResolvedAccount = IAccount & { _id: mongoose.Types.ObjectId };

/**
 * Resolve a system account for a company, or return null if the chart of
 * accounts has no suitable account.
 */
export async function findSystemAccount(
  companyId: mongoose.Types.ObjectId | string,
  role: SystemAccount,
  session?: ClientSession | null,
): Promise<ResolvedAccount | null> {
  const rule = RULES[role];
  const base = {
    companyId: new mongoose.Types.ObjectId(String(companyId)),
    accountType: rule.accountType,
    isActive: { $ne: false },
  };

  for (const criterion of rule.criteria) {
    const account = await Account.findOne({ ...base, ...criterion })
      .sort({ accountCode: 1 })
      .session(session ?? null)
      .lean();
    if (account) return account as unknown as ResolvedAccount;
  }

  return null;
}

/**
 * Resolve a system account or throw a descriptive error.
 */
export async function requireSystemAccount(
  companyId: mongoose.Types.ObjectId | string,
  role: SystemAccount,
  session?: ClientSession | null,
): Promise<ResolvedAccount> {
  const account = await findSystemAccount(companyId, role, session);
  if (!account) {
    throw new Error(
      `${RULES[role].label} account not found. Please set up your chart of accounts.`,
    );
  }
  return account;
}

/**
 * Find (or create) the Opening Balance Equity account used as the offset for
 * starting balances (account opening balances, opening inventory).
 */
export async function getOrCreateOpeningBalanceEquity(
  companyId: mongoose.Types.ObjectId | string,
  session?: ClientSession | null,
): Promise<ResolvedAccount> {
  const cId = new mongoose.Types.ObjectId(String(companyId));
  const existing = await Account.findOne({
    companyId: cId,
    accountType: "Equity",
    accountName: /^opening balance equity$/i,
  })
    .session(session ?? null)
    .lean();
  if (existing) return existing as unknown as ResolvedAccount;

  for (const accountCode of ["3900", "3950", "3999"]) {
    const taken = await Account.exists({ companyId: cId, accountCode }).session(
      session ?? null,
    );
    if (taken) continue;
    const [created] = await Account.create(
      [
        {
          companyId: cId,
          accountCode,
          accountName: "Opening Balance Equity",
          accountType: "Equity",
          subType: "Owner's Equity",
          normalBalance: "Credit",
          balance: 0,
          isActive: true,
        },
      ],
      { session: session ?? undefined },
    );
    return created.toObject() as unknown as ResolvedAccount;
  }

  throw new Error(
    "Could not create an Opening Balance Equity account. Please create one and post the opening balance as a journal entry.",
  );
}
