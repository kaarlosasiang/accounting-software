import { MongoClient, ObjectId } from "mongodb";
import { vi } from "vitest";

/**
 * Test Data Generators
 * Reusable functions for creating test data across different test suites
 */

export interface TestCompany {
  _id: ObjectId;
  name: string;
  slug: string;
}

export interface TestUser {
  _id: ObjectId;
  name: string;
  email: string;
}

export interface TestAccount {
  _id: ObjectId;
  companyId: ObjectId;
  accountCode: string;
  accountName: string;
  accountType: string;
  subType: string;
}

/**
 * Create a test company in the database
 */
export async function createTestCompany(
  db: any,
  name: string = "Test Company",
  slug?: string,
): Promise<TestCompany> {
  const companySlug = slug || `test-company-${Date.now()}`;
  const result = await db.collection("organizations").insertOne({
    name,
    slug: companySlug,
    metadata: {},
    createdAt: new Date(),
  });

  return {
    _id: result.insertedId,
    name,
    slug: companySlug,
  };
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
  db: any,
  email?: string,
  name: string = "Test User",
): Promise<TestUser> {
  const userEmail = email || `test-${Date.now()}@example.com`;
  const username = `testuser-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const result = await db.collection("users").insertOne({
    name,
    email: userEmail,
    username,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    _id: result.insertedId,
    name,
    email: userEmail,
  };
}

/**
 * Create standard chart of accounts for testing
 */
export async function createTestChartOfAccounts(
  db: any,
  companyId: ObjectId,
  userId: ObjectId,
): Promise<TestAccount[]> {
  const accounts = [
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "1000",
      accountName: "Cash on Hand",
      accountType: "Asset",
      subType: "Current Asset",
      description: "Cash and cash equivalents",
      normalBalance: "debit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "1010",
      accountName: "Cash in Bank",
      accountType: "Asset",
      subType: "Current Asset",
      description: "Bank account balances",
      normalBalance: "debit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "1100",
      accountName: "Accounts Receivable",
      accountType: "Asset",
      subType: "Current Asset",
      description: "Amounts owed by customers",
      normalBalance: "debit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "1200",
      accountName: "Inventory",
      accountType: "Asset",
      subType: "Current Asset",
      description: "Inventory on hand",
      normalBalance: "debit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "1500",
      accountName: "Equipment",
      accountType: "Asset",
      subType: "Fixed Asset",
      description: "Equipment and machinery",
      normalBalance: "debit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "2000",
      accountName: "Accounts Payable",
      accountType: "Liability",
      subType: "Current Liability",
      description: "Amounts owed to suppliers",
      normalBalance: "credit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "2100",
      accountName: "Accrued Expenses",
      accountType: "Liability",
      subType: "Current Liability",
      description: "Accrued expenses payable",
      normalBalance: "credit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "2500",
      accountName: "Long-term Loan",
      accountType: "Liability",
      subType: "Long-term Liability",
      description: "Long-term debt",
      normalBalance: "credit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "3000",
      accountName: "Owner's Equity",
      accountType: "Equity",
      subType: "Capital",
      description: "Owner's capital investment",
      normalBalance: "credit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "3100",
      accountName: "Retained Earnings",
      accountType: "Equity",
      subType: "Retained Earnings",
      description: "Accumulated retained earnings",
      normalBalance: "credit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "4000",
      accountName: "Sales Revenue",
      accountType: "Revenue",
      subType: "Operating Revenue",
      description: "Revenue from sales",
      normalBalance: "credit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "4100",
      accountName: "Service Revenue",
      accountType: "Revenue",
      subType: "Operating Revenue",
      description: "Revenue from services",
      normalBalance: "credit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "5000",
      accountName: "Cost of Goods Sold",
      accountType: "Expense",
      subType: "Cost of Sales",
      description: "Direct costs of goods sold",
      normalBalance: "debit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "5100",
      accountName: "Operating Expenses",
      accountType: "Expense",
      subType: "Operating Expense",
      description: "General operating expenses",
      normalBalance: "debit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      companyId,
      accountCode: "5200",
      accountName: "Salaries Expense",
      accountType: "Expense",
      subType: "Operating Expense",
      description: "Employee salaries",
      normalBalance: "debit",
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.collection("accounts").insertMany(accounts);

  return accounts.map((account) => ({
    _id: account._id,
    companyId: account.companyId,
    accountCode: account.accountCode,
    accountName: account.accountName,
    accountType: account.accountType,
    subType: account.subType,
  }));
}

/**
 * Create a test supplier
 */
export async function createTestSupplier(
  db: any,
  companyId: ObjectId,
  userId: ObjectId,
  supplierName: string = "Test Supplier",
) {
  const result = await db.collection("suppliers").insertOne({
    companyId,
    supplierName,
    contactPerson: "John Doe",
    email: `${supplierName.toLowerCase().replace(/\s+/g, "-")}@test.com`,
    phone: "123456789",
    address: "123 Test Street",
    paymentTerms: "Net 30",
    status: "active",
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    _id: result.insertedId,
    supplierName,
  };
}

/**
 * Create a test customer
 */
export async function createTestCustomer(
  db: any,
  companyId: ObjectId,
  userId: ObjectId,
  customerName: string = "Test Customer",
) {
  const result = await db.collection("customers").insertOne({
    companyId,
    customerName,
    contactPerson: "Jane Doe",
    email: `${customerName.toLowerCase().replace(/\s+/g, "-")}@test.com`,
    phone: "987654321",
    address: "456 Test Avenue",
    paymentTerms: "Net 30",
    status: "active",
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    _id: result.insertedId,
    customerName,
  };
}

/**
 * Create a test journal entry
 */
export async function createTestJournalEntry(
  db: any,
  companyId: ObjectId,
  userId: ObjectId,
  entries: Array<{
    accountId: ObjectId;
    debit: string;
    credit: string;
  }>,
  description: string = "Test journal entry",
  entryDate: Date = new Date(),
) {
  const totalDebit = entries
    .reduce((sum, entry) => sum + parseFloat(entry.debit), 0)
    .toString();
  const totalCredit = entries
    .reduce((sum, entry) => sum + parseFloat(entry.credit), 0)
    .toString();

  const journalEntryId = new ObjectId();
  await db.collection("journal_entries").insertOne({
    _id: journalEntryId,
    companyId,
    entryNumber: `JE-TEST-${Date.now()}`,
    entryDate,
    description,
    entries,
    totalDebit,
    totalCredit,
    status: "posted",
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create corresponding ledger entries
  const ledgerEntries = entries.map((entry) => ({
    companyId,
    accountId: entry.accountId,
    journalEntryId,
    transactionDate: entryDate,
    description,
    debit: entry.debit,
    credit: entry.credit,
    balance: "0", // Will be calculated by ledger service
    createdAt: new Date(),
  }));

  await db.collection("ledger").insertMany(ledgerEntries);

  return {
    _id: journalEntryId,
    totalDebit,
    totalCredit,
  };
}

/**
 * Clean up test data for a company
 */
export async function cleanupTestData(
  db: any,
  companyId: ObjectId,
  userId?: ObjectId,
) {
  await db.collection("organizations").deleteOne({ _id: companyId });
  if (userId) {
    await db.collection("users").deleteOne({ _id: userId });
  }
  await db.collection("accounts").deleteMany({ companyId });
  await db.collection("suppliers").deleteMany({ companyId });
  await db.collection("customers").deleteMany({ companyId });
  await db.collection("bills").deleteMany({ companyId });
  await db.collection("invoices").deleteMany({ companyId });
  await db.collection("payments").deleteMany({ companyId });
  await db.collection("journal_entries").deleteMany({ companyId });
  await db.collection("ledger").deleteMany({ companyId });
  await db.collection("inventory").deleteMany({ companyId });
}

/**
 * Wait for a condition to be true (useful for async operations)
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100,
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error("Timeout waiting for condition");
}

/**
 * Generate random test data
 */
export const testDataGenerators = {
  randomEmail: () =>
    `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  randomPhoneNumber: () => Math.floor(Math.random() * 9000000000) + 1000000000,
  randomAmount: (min: number = 100, max: number = 10000) =>
    Math.floor(Math.random() * (max - min + 1)) + min,
  randomDate: (daysAgo: number = 30) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date;
  },
};

/**
 * Mock request helpers
 */
export const mockHelpers = {
  createMockRequest: (overrides: any = {}) => ({
    body: {},
    query: {},
    params: {},
    user: null,
    authSession: null,
    ...overrides,
  }),
  createMockResponse: () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
  },
};
