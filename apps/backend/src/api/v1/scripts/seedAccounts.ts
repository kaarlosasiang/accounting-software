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
    accountCode: "1100",
    accountName: "Accounts Receivable",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Amounts owed by customers",
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
    accountCode: "1300",
    accountName: "Prepaid Expenses",
    accountType: "Asset",
    subType: "Current Asset",
    normalBalance: "Debit",
    description: "Expenses paid in advance",
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
    accountCode: "1550",
    accountName: "Accumulated Depreciation",
    accountType: "Asset",
    subType: "Fixed Asset",
    normalBalance: "Credit",
    description: "Accumulated depreciation on fixed assets",
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
    accountCode: "2200",
    accountName: "Sales Tax Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Sales tax collected and owed to government",
  },
  {
    accountCode: "2210",
    accountName: "VAT Payable",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Value Added Tax payable",
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
    accountCode: "2400",
    accountName: "Unearned Revenue",
    accountType: "Liability",
    subType: "Current Liability",
    normalBalance: "Credit",
    description: "Revenue received but not yet earned",
  },
  // Long-term Liabilities
  {
    accountCode: "2500",
    accountName: "Notes Payable",
    accountType: "Liability",
    subType: "Long-term Liability",
    normalBalance: "Credit",
    description: "Long-term notes and loans payable",
  },
  {
    accountCode: "2600",
    accountName: "Bank Loan",
    accountType: "Liability",
    subType: "Long-term Liability",
    normalBalance: "Credit",
    description: "Bank loans payable",
  },

  // ===== EQUITY (3000-3999) =====
  {
    accountCode: "3000",
    accountName: "Owner's Capital",
    accountType: "Equity",
    subType: "Owner's Equity",
    normalBalance: "Credit",
    description: "Owner's investment in the business",
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
    accountCode: "3200",
    accountName: "Retained Earnings",
    accountType: "Equity",
    subType: "Retained Earnings",
    normalBalance: "Credit",
    description: "Accumulated profits retained in the business",
  },

  // ===== REVENUE (4000-4999) =====
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
    accountCode: "4500",
    accountName: "Interest Income",
    accountType: "Revenue",
    subType: "Other Income",
    normalBalance: "Credit",
    description: "Interest earned on investments or deposits",
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
    accountCode: "5100",
    accountName: "Purchase Discounts",
    accountType: "Expense",
    subType: "Cost of Sales",
    normalBalance: "Credit",
    description: "Discounts received from suppliers",
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
    subType: "Operating Expense",
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
        `Accounts already exist for company ${companyId}. Skipping seed.`
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
      `Successfully seeded ${defaultAccounts.length} accounts for company ${companyId}`
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
    console.error(
      "Usage: npx tsx src/api/v1/scripts/seedAccounts.ts <companyId>"
    );
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    await seedAccountsForCompany(companyId);

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default defaultAccounts;
