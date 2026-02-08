import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId, Decimal128 } from "mongodb";
import { constants } from "../../../config/index.js";

describe("Report Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let cashAccountId: ObjectId;
  let arAccountId: ObjectId;
  let apAccountId: ObjectId;
  let revenueAccountId: ObjectId;
  let expenseAccountId: ObjectId;
  let equityAccountId: ObjectId;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Report Tests",
      slug: "test-company-reports",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("users").insertOne({
      name: "Test User",
      email: "test-reports@example.com",
      username: `test-user-reports-${Date.now()}`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Create test chart of accounts
    cashAccountId = new ObjectId();
    arAccountId = new ObjectId();
    apAccountId = new ObjectId();
    revenueAccountId = new ObjectId();
    expenseAccountId = new ObjectId();
    equityAccountId = new ObjectId();

    await db.collection("accounts").insertMany([
      {
        _id: cashAccountId,
        companyId: testCompanyId,
        accountCode: "1000",
        accountName: "Cash on Hand",
        accountType: "Asset",
        subType: "Current Asset",
        description: "Cash and cash equivalents",
        normalBalance: "debit",
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: arAccountId,
        companyId: testCompanyId,
        accountCode: "1100",
        accountName: "Accounts Receivable",
        accountType: "Asset",
        subType: "Current Asset",
        description: "Amounts owed by customers",
        normalBalance: "debit",
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: apAccountId,
        companyId: testCompanyId,
        accountCode: "2000",
        accountName: "Accounts Payable",
        accountType: "Liability",
        subType: "Current Liability",
        description: "Amounts owed to suppliers",
        normalBalance: "credit",
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: revenueAccountId,
        companyId: testCompanyId,
        accountCode: "4000",
        accountName: "Sales Revenue",
        accountType: "Revenue",
        subType: "Operating Revenue",
        description: "Revenue from sales",
        normalBalance: "credit",
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: expenseAccountId,
        companyId: testCompanyId,
        accountCode: "5000",
        accountName: "Operating Expenses",
        accountType: "Expense",
        subType: "Operating Expense",
        description: "Regular operating expenses",
        normalBalance: "debit",
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: equityAccountId,
        companyId: testCompanyId,
        accountCode: "3000",
        accountName: "Owner's Equity",
        accountType: "Equity",
        subType: "Capital",
        description: "Owner's capital investment",
        normalBalance: "credit",
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create test journal entry and ledger entries
    const journalEntryId = new ObjectId();
    await db.collection("journal_entries").insertOne({
      _id: journalEntryId,
      companyId: testCompanyId,
      entryNumber: "JE-TEST-001",
      entryDate: new Date("2026-01-15"),
      description: "Test transaction",
      entries: [
        {
          accountId: cashAccountId,
          debit: "5000",
          credit: "0",
        },
        {
          accountId: revenueAccountId,
          debit: "0",
          credit: "5000",
        },
      ],
      totalDebit: "5000",
      totalCredit: "5000",
      status: "posted",
      createdBy: testUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create ledger entries
    await db.collection("ledger").insertMany([
      {
        companyId: testCompanyId,
        accountId: cashAccountId,
        journalEntryId: journalEntryId,
        transactionDate: new Date("2026-01-15"),
        description: "Test transaction",
        debit: "5000",
        credit: "0",
        balance: "5000",
        createdAt: new Date(),
      },
      {
        companyId: testCompanyId,
        accountId: revenueAccountId,
        journalEntryId: journalEntryId,
        transactionDate: new Date("2026-01-15"),
        description: "Test transaction",
        debit: "0",
        credit: "5000",
        balance: "5000",
        createdAt: new Date(),
      },
    ]);

    // Add opening balance for equity to balance the books
    const openingJournalId = new ObjectId();
    await db.collection("journal_entries").insertOne({
      _id: openingJournalId,
      companyId: testCompanyId,
      entryNumber: "JE-OPENING-001",
      entryDate: new Date("2026-01-01"),
      description: "Opening balance",
      entries: [
        {
          accountId: cashAccountId,
          debit: "10000",
          credit: "0",
        },
        {
          accountId: equityAccountId,
          debit: "0",
          credit: "10000",
        },
      ],
      totalDebit: "10000",
      totalCredit: "10000",
      status: "posted",
      createdBy: testUserId,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    await db.collection("ledger").insertMany([
      {
        companyId: testCompanyId,
        accountId: cashAccountId,
        journalEntryId: openingJournalId,
        transactionDate: new Date("2026-01-01"),
        description: "Opening balance",
        debit: "10000",
        credit: "0",
        balance: "10000",
        createdAt: new Date("2026-01-01"),
      },
      {
        companyId: testCompanyId,
        accountId: equityAccountId,
        journalEntryId: openingJournalId,
        transactionDate: new Date("2026-01-01"),
        description: "Opening balance",
        debit: "0",
        credit: "10000",
        balance: "10000",
        createdAt: new Date("2026-01-01"),
      },
    ]);
  });

  afterAll(async () => {
    const db = mongoClient.db();

    // Clean up test data
    await db.collection("organizations").deleteOne({ _id: testCompanyId });
    await db.collection("users").deleteOne({ _id: testUserId });
    await db.collection("accounts").deleteMany({ companyId: testCompanyId });
    await db
      .collection("journal_entries")
      .deleteMany({ companyId: testCompanyId });
    await db.collection("ledger").deleteMany({ companyId: testCompanyId });

    await mongoClient.close();
  });

  describe("GET /api/v1/reports/balance-sheet", () => {
    it("should generate balance sheet with correct structure", async () => {
      const response = await request(app)
        .get("/api/v1/reports/balance-sheet")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("asOfDate");
      expect(response.body.data).toHaveProperty("assets");
      expect(response.body.data).toHaveProperty("liabilities");
      expect(response.body.data).toHaveProperty("equity");
      expect(response.body.data).toHaveProperty("balanced");
      expect(response.body.data).toHaveProperty("equation");
    });

    it("should verify accounting equation: Assets = Liabilities + Equity", async () => {
      const response = await request(app)
        .get("/api/v1/reports/balance-sheet")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      const { assets, liabilities, equity, balanced, equation } =
        response.body.data;

      // Check if balanced
      expect(balanced).toBe(true);

      // Verify equation
      const calculatedDifference =
        equation.assets - (equation.liabilities + equation.equity);
      expect(Math.abs(calculatedDifference)).toBeLessThan(0.01);
    });

    it("should accept asOfDate query parameter", async () => {
      const testDate = "2026-01-20";
      const response = await request(app)
        .get("/api/v1/reports/balance-sheet")
        .query({
          companyId: testCompanyId.toString(),
          asOfDate: testDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should require companyId", async () => {
      const response = await request(app).get("/api/v1/reports/balance-sheet");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should include asset subtypes (current, fixed, other)", async () => {
      const response = await request(app)
        .get("/api/v1/reports/balance-sheet")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.assets).toHaveProperty("currentAssets");
      expect(response.body.data.assets).toHaveProperty("fixedAssets");
      expect(response.body.data.assets).toHaveProperty("otherAssets");
      expect(response.body.data.assets).toHaveProperty("total");
      expect(Array.isArray(response.body.data.assets.currentAssets)).toBe(true);
    });

    it("should include liability subtypes (current, long-term, other)", async () => {
      const response = await request(app)
        .get("/api/v1/reports/balance-sheet")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.liabilities).toHaveProperty(
        "currentLiabilities",
      );
      expect(response.body.data.liabilities).toHaveProperty(
        "longTermLiabilities",
      );
      expect(response.body.data.liabilities).toHaveProperty("otherLiabilities");
      expect(response.body.data.liabilities).toHaveProperty("total");
    });
  });

  describe("GET /api/v1/reports/income-statement", () => {
    it("should generate income statement with correct structure", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/income-statement")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("period");
      expect(response.body.data).toHaveProperty("revenue");
      expect(response.body.data).toHaveProperty("expenses");
      expect(response.body.data).toHaveProperty("summary");
    });

    it("should calculate net income correctly", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/income-statement")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      const { revenue, expenses, summary } = response.body.data;

      // Net Income = Total Revenue - Total Expenses
      const calculatedNetIncome = revenue.total - expenses.total;
      expect(summary.netIncome).toBeCloseTo(calculatedNetIncome, 2);
    });

    it("should include revenue by subtype", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/income-statement")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.revenue).toHaveProperty("operatingRevenue");
      expect(response.body.data.revenue).toHaveProperty("otherIncome");
      expect(response.body.data.revenue).toHaveProperty("total");
    });

    it("should include expense by subtype", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/income-statement")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.expenses).toHaveProperty("costOfSales");
      expect(response.body.data.expenses).toHaveProperty("operatingExpenses");
      expect(response.body.data.expenses).toHaveProperty(
        "nonOperatingExpenses",
      );
      expect(response.body.data.expenses).toHaveProperty("total");
    });

    it("should require companyId", async () => {
      const response = await request(app).get(
        "/api/v1/reports/income-statement",
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should default to year-to-date if no dates provided", async () => {
      const response = await request(app)
        .get("/api/v1/reports/income-statement")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toHaveProperty("startDate");
      expect(response.body.data.period).toHaveProperty("endDate");
    });
  });

  describe("GET /api/v1/reports/cash-flow", () => {
    it("should generate cash flow statement with correct structure", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/cash-flow")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("period");
      expect(response.body.data).toHaveProperty("operatingActivities");
      expect(response.body.data).toHaveProperty("investingActivities");
      expect(response.body.data).toHaveProperty("financingActivities");
      expect(response.body.data).toHaveProperty("summary");
    });

    it("should include operating activities with adjustments", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/cash-flow")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.operatingActivities).toHaveProperty(
        "netIncome",
      );
      expect(response.body.data.operatingActivities).toHaveProperty(
        "adjustments",
      );
      expect(response.body.data.operatingActivities).toHaveProperty("total");
      expect(
        Array.isArray(response.body.data.operatingActivities.adjustments),
      ).toBe(true);
    });

    it("should include investing activities", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/cash-flow")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.investingActivities).toHaveProperty("items");
      expect(response.body.data.investingActivities).toHaveProperty("total");
      expect(Array.isArray(response.body.data.investingActivities.items)).toBe(
        true,
      );
    });

    it("should include financing activities", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/cash-flow")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.financingActivities).toHaveProperty("items");
      expect(response.body.data.financingActivities).toHaveProperty("total");
      expect(Array.isArray(response.body.data.financingActivities.items)).toBe(
        true,
      );
    });

    it("should calculate net cash flow correctly", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/cash-flow")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      const {
        operatingActivities,
        investingActivities,
        financingActivities,
        summary,
      } = response.body.data;

      // Net Cash Flow = Operating + Investing + Financing
      const calculatedNetCashFlow =
        operatingActivities.total +
        investingActivities.total +
        financingActivities.total;
      expect(summary.netCashFlow).toBeCloseTo(calculatedNetCashFlow, 2);
    });

    it("should include beginning and ending cash balances", async () => {
      const startDate = "2026-01-01";
      const endDate = "2026-01-31";

      const response = await request(app)
        .get("/api/v1/reports/cash-flow")
        .query({
          companyId: testCompanyId.toString(),
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.summary).toHaveProperty("beginningCash");
      expect(response.body.data.summary).toHaveProperty("endingCash");
      expect(response.body.data.summary).toHaveProperty("netCashFlow");
      expect(response.body.data.summary).toHaveProperty("calculatedEndingCash");
    });

    it("should require companyId", async () => {
      const response = await request(app).get("/api/v1/reports/cash-flow");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });
  });

  describe("GET /api/v1/reports/trial-balance", () => {
    it("should generate trial balance with correct structure", async () => {
      const response = await request(app)
        .get("/api/v1/reports/trial-balance")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accounts");
      expect(response.body.data).toHaveProperty("totals");
      expect(Array.isArray(response.body.data.accounts)).toBe(true);
    });

    it("should verify trial balance is balanced: Total Debits = Total Credits", async () => {
      const response = await request(app)
        .get("/api/v1/reports/trial-balance")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      const { totals } = response.body.data;

      expect(totals).toHaveProperty("totalDebit");
      expect(totals).toHaveProperty("totalCredit");
      expect(totals.totalDebit).toBeCloseTo(totals.totalCredit, 2);
    });

    it("should include all account types", async () => {
      const response = await request(app)
        .get("/api/v1/reports/trial-balance")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      const accounts = response.body.data.accounts;

      expect(accounts.length).toBeGreaterThan(0);
      accounts.forEach((account: any) => {
        expect(account).toHaveProperty("accountCode");
        expect(account).toHaveProperty("accountName");
        expect(account).toHaveProperty("accountType");
        expect(account).toHaveProperty("debit");
        expect(account).toHaveProperty("credit");
      });
    });

    it("should require companyId", async () => {
      const response = await request(app).get("/api/v1/reports/trial-balance");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should accept asOfDate query parameter", async () => {
      const testDate = "2026-01-20";
      const response = await request(app)
        .get("/api/v1/reports/trial-balance")
        .query({
          companyId: testCompanyId.toString(),
          asOfDate: testDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Report Edge Cases", () => {
    it("should handle empty reports gracefully", async () => {
      // Create a new company with no transactions
      const db = mongoClient.db();
      const emptyCompanyResult = await db
        .collection("organizations")
        .insertOne({
          name: "Empty Test Company",
          slug: "empty-test-company",
          metadata: {},
          createdAt: new Date(),
        });
      const emptyCompanyId = emptyCompanyResult.insertedId;

      const response = await request(app)
        .get("/api/v1/reports/balance-sheet")
        .query({ companyId: emptyCompanyId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Clean up
      await db.collection("organizations").deleteOne({ _id: emptyCompanyId });
    });

    it("should handle same-day date range", async () => {
      const sameDate = "2026-01-15";
      const response = await request(app)
        .get("/api/v1/reports/income-statement")
        .query({
          companyId: testCompanyId.toString(),
          startDate: sameDate,
          endDate: sameDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should handle future dates", async () => {
      const futureDate = "2027-12-31";
      const response = await request(app)
        .get("/api/v1/reports/balance-sheet")
        .query({
          companyId: testCompanyId.toString(),
          asOfDate: futureDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
