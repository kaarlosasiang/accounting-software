import mongoose from "mongoose";
import Account from "../models/Account.js";
import logger from "../config/logger.js";
import dotenv from "dotenv";

dotenv.config();

interface SeedAccount {
  accountCode: string;
  accountName: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  subType?: string;
  normalBalance: "Debit" | "Credit";
  description?: string;
}

/**
 * Standard Chart of Accounts for a business
 */
const defaultAccounts: SeedAccount[] = [
  // ===== ASSETS (1000-1999) =====
  // Current Assets
  {
    accountCode: "1000",
    accountName: "Cash on Hand",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Petty cash and cash in register",
  },
  {
    accountCode: "1010",
    accountName: "Cash in Bank",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Cash held in bank accounts",
  },
  {
    accountCode: "1020",
    accountName: "Petty Cash",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Small amounts of cash for minor expenses",
  },
  {
    accountCode: "1100",
    accountName: "Accounts Receivable",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Amounts owed by customers",
  },
  {
    accountCode: "1110",
    accountName: "Allowance for Doubtful Accounts",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Credit",
    description: "Estimated uncollectible accounts receivable",
  },
  {
    accountCode: "1200",
    accountName: "Inventory",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Goods held for sale",
  },
  {
    accountCode: "1210",
    accountName: "Raw Materials Inventory",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Raw materials for production",
  },
  {
    accountCode: "1220",
    accountName: "Work in Process Inventory",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Goods in the process of being manufactured",
  },
  {
    accountCode: "1230",
    accountName: "Finished Goods Inventory",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Completed products ready for sale",
  },
  {
    accountCode: "1300",
    accountName: "Prepaid Expenses",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Expenses paid in advance",
  },
  {
    accountCode: "1310",
    accountName: "Prepaid Insurance",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Insurance premiums paid in advance",
  },
  {
    accountCode: "1320",
    accountName: "Prepaid Rent",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Rent paid in advance",
  },
  {
    accountCode: "1400",
    accountName: "Input VAT",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Value Added Tax paid on purchases (can be claimed)",
  },
  {
    accountCode: "1410",
    accountName: "Other Receivables",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Other amounts receivable",
  },
  {
    accountCode: "1420",
    accountName: "Advances to Employees",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Money advanced to employees",
  },
  {
    accountCode: "1430",
    accountName: "Advances to Suppliers",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Prepayments made to suppliers",
  },
  // Fixed Assets
  {
    accountCode: "1500",
    accountName: "Furniture and Fixtures",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Debit",
    description: "Office furniture and fixtures",
  },
  {
    accountCode: "1510",
    accountName: "Equipment",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Debit",
    description: "Machinery and equipment",
  },
  {
    accountCode: "1520",
    accountName: "Vehicles",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Debit",
    description: "Company vehicles",
  },
  {
    accountCode: "1530",
    accountName: "Buildings",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Debit",
    description: "Owned buildings and structures",
  },
  {
    accountCode: "1540",
    accountName: "Land",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Debit",
    description: "Owned land (not depreciated)",
  },
  {
    accountCode: "1550",
    accountName: "Accumulated Depreciation - Furniture and Fixtures",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Credit",
    description: "Accumulated depreciation on furniture and fixtures",
  },
  {
    accountCode: "1560",
    accountName: "Accumulated Depreciation - Equipment",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Credit",
    description: "Accumulated depreciation on equipment",
  },
  {
    accountCode: "1570",
    accountName: "Accumulated Depreciation - Vehicles",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Credit",
    description: "Accumulated depreciation on vehicles",
  },
  {
    accountCode: "1580",
    accountName: "Accumulated Depreciation - Buildings",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Credit",
    description: "Accumulated depreciation on buildings",
  },
  // Intangible Assets
  {
    accountCode: "1600",
    accountName: "Intangible Assets",
    accountType: "Asset",
    subType: "Intangible Asset",
    normalBalance: "Debit",
    description: "Non-physical assets such as patents, trademarks",
  },
  {
    accountCode: "1610",
    accountName: "Accumulated Amortization",
    accountType: "Asset",
    subType: "Intangible Asset",
    normalBalance: "Credit",
    description: "Accumulated amortization on intangible assets",
  },
  // Investments
  {
    accountCode: "1700",
    accountName: "Investments",
    accountType: "Asset",
    subType: "Investment",
    normalBalance: "Debit",
    description: "Long-term investments",
  },

  // ===== LIABILITIES (2000-2999) =====
  // Current Liabilities
  {
    accountCode: "2000",
    accountName: "Accounts Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Amounts owed to suppliers",
  },
  {
    accountCode: "2100",
    accountName: "Accrued Expenses",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Expenses incurred but not yet paid",
  },
  {
    accountCode: "2110",
    accountName: "Accrued Salaries and Wages",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Salaries and wages earned but not yet paid",
  },
  {
    accountCode: "2120",
    accountName: "Accrued Interest Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Interest expense incurred but not yet paid",
  },
  {
    accountCode: "2130",
    accountName: "Accrued Utilities",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Utilities expense incurred but not yet paid",
  },
  {
    accountCode: "2200",
    accountName: "Sales Tax Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Sales tax collected and owed to government",
  },
  {
    accountCode: "2210",
    accountName: "Output VAT",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Value Added Tax collected on sales (must be remitted)",
  },
  {
    accountCode: "2220",
    accountName: "Withholding Tax Payable - Expanded",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Withholding tax on expanded withholding tax (EWT)",
  },
  {
    accountCode: "2230",
    accountName: "Withholding Tax Payable - Compensation",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Withholding tax on employee compensation",
  },
  {
    accountCode: "2240",
    accountName: "Withholding Tax Payable - Final",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Final withholding tax payable",
  },
  {
    accountCode: "2300",
    accountName: "Wages Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Wages owed to employees",
  },
  {
    accountCode: "2310",
    accountName: "SSS Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Social Security System contributions payable",
  },
  {
    accountCode: "2320",
    accountName: "PhilHealth Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description:
      "Philippine Health Insurance Corporation contributions payable",
  },
  {
    accountCode: "2330",
    accountName: "Pag-IBIG Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Pag-IBIG Fund contributions payable",
  },
  {
    accountCode: "2400",
    accountName: "Unearned Revenue",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Revenue received but not yet earned",
  },
  {
    accountCode: "2410",
    accountName: "Customer Deposits",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Deposits received from customers",
  },
  {
    accountCode: "2500",
    accountName: "Short-term Notes Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Short-term notes and loans payable",
  },
  // Long-term Liabilities
  {
    accountCode: "2600",
    accountName: "Long-term Notes Payable",
    accountType: "Liability",
    subType: "Long-term Liability",
    normalBalance: "Credit",
    description: "Long-term notes and loans payable",
  },
  {
    accountCode: "2610",
    accountName: "Bank Loan - Long-term",
    accountType: "Liability",
    subType: "Long-term Liability",
    normalBalance: "Credit",
    description: "Long-term bank loans payable",
  },
  {
    accountCode: "2620",
    accountName: "Mortgage Payable",
    accountType: "Liability",
    subType: "Long-term Liability",
    normalBalance: "Credit",
    description: "Mortgage loans payable",
  },

  // ===== EQUITY (3000-3999) =====
  // Owner's Equity (Sole Proprietorship/Partnership)
  {
    accountCode: "3000",
    accountName: "Owner's Capital",
    accountType: "Equity",
    subType: "Owner's Equity",
    normalBalance: "Credit",
    description: "Owner's investment in the business",
  },
  {
    accountCode: "3010",
    accountName: "Partner's Capital",
    accountType: "Equity",
    subType: "Owner's Equity",
    normalBalance: "Credit",
    description: "Partner's investment in the business",
  },
  {
    accountCode: "3100",
    accountName: "Owner's Drawing",
    accountType: "Equity",
    subType: "Owner's Equity",
    normalBalance: "Debit",
    description: "Owner's withdrawals from the business",
  },
  {
    accountCode: "3110",
    accountName: "Partner's Drawing",
    accountType: "Equity",
    subType: "Owner's Equity",
    normalBalance: "Debit",
    description: "Partner's withdrawals from the business",
  },
  // Corporate Equity
  {
    accountCode: "3200",
    accountName: "Common Stock",
    accountType: "Equity",
    subType: "Share Capital",
    normalBalance: "Credit",
    description: "Common stock issued by the corporation",
  },
  {
    accountCode: "3210",
    accountName: "Preferred Stock",
    accountType: "Equity",
    subType: "Share Capital",
    normalBalance: "Credit",
    description: "Preferred stock issued by the corporation",
  },
  {
    accountCode: "3220",
    accountName: "Additional Paid-in Capital",
    accountType: "Equity",
    subType: "Share Capital",
    normalBalance: "Credit",
    description: "Amount paid for stock above par value",
  },
  {
    accountCode: "3300",
    accountName: "Retained Earnings",
    accountType: "Equity",
    subType: "Retained Earnings",
    normalBalance: "Credit",
    description: "Accumulated profits retained in the business",
  },
  {
    accountCode: "3310",
    accountName: "Current Year Earnings",
    accountType: "Equity",
    subType: "Retained Earnings",
    normalBalance: "Credit",
    description: "Current year's net income or loss",
  },
  {
    accountCode: "3400",
    accountName: "Dividends Payable",
    accountType: "Equity",
    subType: "Dividends",
    normalBalance: "Credit",
    description: "Dividends declared but not yet paid",
  },

  // ===== REVENUE (4000-4999) =====
  // Operating Revenue
  {
    accountCode: "4000",
    accountName: "Sales Revenue",
    accountType: "Revenue",
    subType: "Operating Revenue",
    normalBalance: "Credit",
    description: "Revenue from sale of goods",
  },
  {
    accountCode: "4010",
    accountName: "Service Revenue",
    accountType: "Revenue",
    subType: "Operating Revenue",
    normalBalance: "Credit",
    description: "Revenue from services rendered",
  },
  {
    accountCode: "4020",
    accountName: "Consulting Revenue",
    accountType: "Revenue",
    subType: "Operating Revenue",
    normalBalance: "Credit",
    description: "Revenue from consulting services",
  },
  {
    accountCode: "4030",
    accountName: "Rental Income",
    accountType: "Revenue",
    subType: "Operating Revenue",
    normalBalance: "Credit",
    description: "Income from renting property or equipment",
  },
  {
    accountCode: "4040",
    accountName: "Commission Income",
    accountType: "Revenue",
    subType: "Operating Revenue",
    normalBalance: "Credit",
    description: "Revenue from commissions",
  },
  // Contra Revenue
  {
    accountCode: "4100",
    accountName: "Sales Discounts",
    accountType: "Revenue",
    subType: "Contra Revenue",
    normalBalance: "Debit",
    description: "Discounts given to customers",
  },
  {
    accountCode: "4110",
    accountName: "Sales Returns and Allowances",
    accountType: "Revenue",
    subType: "Contra Revenue",
    normalBalance: "Debit",
    description: "Returns and allowances on sales",
  },
  {
    accountCode: "4120",
    accountName: "Sales Discounts - Early Payment",
    accountType: "Revenue",
    subType: "Contra Revenue",
    normalBalance: "Debit",
    description: "Discounts for early payment",
  },
  // Other Income
  {
    accountCode: "4500",
    accountName: "Interest Income",
    accountType: "Revenue",
    subType: "Other Income",
    normalBalance: "Credit",
    description: "Interest earned on investments or deposits",
  },
  {
    accountCode: "4510",
    accountName: "Dividend Income",
    accountType: "Revenue",
    subType: "Other Income",
    normalBalance: "Credit",
    description: "Dividends received from investments",
  },
  {
    accountCode: "4520",
    accountName: "Gain on Sale of Assets",
    accountType: "Revenue",
    subType: "Other Income",
    normalBalance: "Credit",
    description: "Gain from sale of fixed assets",
  },
  {
    accountCode: "4530",
    accountName: "Foreign Exchange Gain",
    accountType: "Revenue",
    subType: "Other Income",
    normalBalance: "Credit",
    description: "Gain from foreign currency transactions",
  },
  {
    accountCode: "4600",
    accountName: "Other Income",
    accountType: "Revenue",
    subType: "Other Income",
    normalBalance: "Credit",
    description: "Miscellaneous income",
  },

  // ===== EXPENSES (5000-5999) =====
  // Cost of Goods Sold
  {
    accountCode: "5000",
    accountName: "Cost of Goods Sold",
    accountType: "Expense",
    subType: "Cost of Sales",
    normalBalance: "Debit",
    description: "Direct cost of goods sold",
  },
  {
    accountCode: "5010",
    accountName: "Cost of Goods Sold - Food",
    accountType: "Expense",
    subType: "Cost of Sales",
    normalBalance: "Debit",
    description: "Cost of food items sold",
  },
  {
    accountCode: "5020",
    accountName: "Cost of Goods Sold - Non-Food",
    accountType: "Expense",
    subType: "Cost of Sales",
    normalBalance: "Debit",
    description: "Cost of non-food items sold",
  },
  {
    accountCode: "5030",
    accountName: "Cost of Goods Sold - Raw Materials",
    accountType: "Expense",
    subType: "Cost of Sales",
    normalBalance: "Debit",
    description: "Cost of raw materials used in production",
  },
  {
    accountCode: "5100",
    accountName: "Purchase Discounts",
    accountType: "Expense",
    subType: "Cost of Sales",
    normalBalance: "Credit",
    description: "Discounts received from suppliers",
  },
  {
    accountCode: "5110",
    accountName: "Purchase Returns and Allowances",
    accountType: "Expense",
    subType: "Cost of Sales",
    normalBalance: "Credit",
    description: "Returns and allowances on purchases",
  },
  {
    accountCode: "5120",
    accountName: "Inventory Adjustment",
    accountType: "Expense",
    subType: "Cost of Sales",
    normalBalance: "Debit",
    description: "Inventory write-downs and adjustments",
  },
  {
    accountCode: "5130",
    accountName: "Inventory Shrinkage",
    accountType: "Expense",
    subType: "Cost of Sales",
    normalBalance: "Debit",
    description: "Inventory losses due to theft, damage, or counting errors",
  },
  // Operating Expenses
  {
    accountCode: "6000",
    accountName: "Salaries and Wages",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Employee salaries and wages",
  },
  {
    accountCode: "6010",
    accountName: "Employee Benefits",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Employee benefits and contributions",
  },
  {
    accountCode: "6100",
    accountName: "Rent Expense",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Rent for office or store space",
  },
  {
    accountCode: "6110",
    accountName: "Utilities Expense",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Electricity, water, and other utilities",
  },
  {
    accountCode: "6120",
    accountName: "Telephone and Internet",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Communication expenses",
  },
  {
    accountCode: "6200",
    accountName: "Office Supplies",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Office supplies and stationery",
  },
  {
    accountCode: "6210",
    accountName: "Postage and Shipping",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Shipping and delivery costs",
  },
  {
    accountCode: "6300",
    accountName: "Insurance Expense",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Business insurance premiums",
  },
  {
    accountCode: "6400",
    accountName: "Depreciation Expense",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Depreciation on fixed assets",
  },
  {
    accountCode: "6500",
    accountName: "Repairs and Maintenance",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Maintenance and repair costs",
  },
  {
    accountCode: "6600",
    accountName: "Advertising and Marketing",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Marketing and advertising costs",
  },
  {
    accountCode: "6700",
    accountName: "Professional Fees",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Legal, accounting, and consulting fees",
  },
  {
    accountCode: "6800",
    accountName: "Travel and Transportation",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Business travel expenses",
  },
  {
    accountCode: "6900",
    accountName: "Bank Charges",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Bank fees and charges",
  },
  {
    accountCode: "6910",
    accountName: "Interest Expense",
    accountType: "Expense",
    subType: "Non-Operating Expense",
    normalBalance: "Debit",
    description: "Interest on loans and borrowings",
  },
  {
    accountCode: "6999",
    accountName: "Miscellaneous Expense",
    accountType: "Expense",
    subType: "Operating Expense",
    normalBalance: "Debit",
    description: "Other miscellaneous expenses",
  },
  // Non-Operating Expenses
  {
    accountCode: "7000",
    accountName: "Loss on Sale of Assets",
    accountType: "Expense",
    subType: "Non-Operating Expense",
    normalBalance: "Debit",
    description: "Loss from sale of fixed assets",
  },
  {
    accountCode: "7010",
    accountName: "Foreign Exchange Loss",
    accountType: "Expense",
    subType: "Non-Operating Expense",
    normalBalance: "Debit",
    description: "Loss from foreign currency transactions",
  },
  {
    accountCode: "7020",
    accountName: "Bad Debt Expense",
    accountType: "Expense",
    subType: "Non-Operating Expense",
    normalBalance: "Debit",
    description: "Uncollectible accounts receivable written off",
  },
  {
    accountCode: "7100",
    accountName: "Income Tax Expense",
    accountType: "Expense",
    subType: "Tax Expense",
    normalBalance: "Debit",
    description: "Income tax expense for the period",
  },
  {
    accountCode: "7110",
    accountName: "Deferred Tax Expense",
    accountType: "Expense",
    subType: "Tax Expense",
    normalBalance: "Debit",
    description: "Deferred income tax expense",
  },
];

/**
 * Seed accounts for a specific company
 */
export async function seedAccountsForCompany(companyId: string): Promise<void> {
  try {
    // Check if accounts already exist for this company
    const existingCount = await Account.countDocuments({ companyId });

    if (existingCount > 0) {
      logger.info(
        `Accounts already exist for company ${companyId}. Skipping seed.`,
      );
      return;
    }

    // Create accounts with the company ID
    const accountsWithCompanyId = defaultAccounts.map((account) => ({
      ...account,
      companyId: new mongoose.Types.ObjectId(companyId),
      balance: 0,
    }));

    await Account.insertMany(accountsWithCompanyId);

    logger.info(
      `Successfully seeded ${defaultAccounts.length} accounts for company ${companyId}`,
    );
  } catch (error) {
    logger.logError(error as Error, {
      operation: "seed-accounts-for-company",
      companyId,
    });
    throw error;
  }
}

/**
 * Standalone script to seed accounts
 * Usage: npx tsx src/api/v1/scripts/seedAccounts.ts <companyId>
 */
async function main() {
  const companyId = process.argv[2];

  if (!companyId) {
    logger.error(
      "Usage: npx tsx src/api/v1/scripts/seedAccounts.ts <companyId>",
    );
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info("Connected to MongoDB");

    await seedAccountsForCompany(companyId);

    logger.info("Seeding complete!");
  } catch (error) {
    logger.logError(error as Error, { operation: "seed-accounts-main" });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default defaultAccounts;
