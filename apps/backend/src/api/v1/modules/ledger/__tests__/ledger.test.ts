import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

// Cast as any to avoid strict better-auth endpoint types
const mockedAuthServer = vi.mocked(authServer) as any;

describe("Ledger Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let testCashAccountId: ObjectId;
  let testRevenueAccountId: ObjectId;
  let testExpenseAccountId: ObjectId;
  let postedEntryId: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data
    await db
      .collection("users")
      .deleteMany({ email: "test-ledger@example.com" });
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-ledger" });
    await db.collection("accounts").deleteMany({
      _id: {
        $in: [
          new ObjectId("607f1f77bcf86cd799439031"),
          new ObjectId("607f1f77bcf86cd799439032"),
          new ObjectId("607f1f77bcf86cd799439033"),
        ],
      },
    });
    await db.collection("journalEntries").deleteMany({});
    await db.collection("ledgers").deleteMany({});

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Ledger Tests",
      slug: "test-company-ledger",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("users").insertOne({
      name: "Test User Ledger",
      email: "test-ledger@example.com",
      username: "test-ledger-user",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Create test accounts
    testCashAccountId = new ObjectId("607f1f77bcf86cd799439031");
    testRevenueAccountId = new ObjectId("607f1f77bcf86cd799439032");
    testExpenseAccountId = new ObjectId("607f1f77bcf86cd799439033");

    await db.collection("accounts").insertMany([
      {
        _id: testCashAccountId,
        companyId: testCompanyId,
        accountCode: "1100",
        accountName: "Cash - Ledger Test",
        accountType: "Asset",
        subType: "Current Asset",
        normalBalance: "Debit",
        balance: 0,
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: testRevenueAccountId,
        companyId: testCompanyId,
        accountCode: "4100",
        accountName: "Revenue - Ledger Test",
        accountType: "Revenue",
        subType: "Operating Revenue",
        normalBalance: "Credit",
        balance: 0,
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: testExpenseAccountId,
        companyId: testCompanyId,
        accountCode: "5100",
        accountName: "Expense - Ledger Test",
        accountType: "Expense",
        subType: "Operating Expense",
        normalBalance: "Debit",
        balance: 0,
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Mock authenticated session
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-ledger@example.com",
        name: "Test User Ledger",
        companyId: testCompanyId.toString(),
        role: "admin",
      },
      session: {
        activeOrganizationId: testCompanyId.toString(),
      },
    });

    // Seed ledger data by creating and posting journal entries via API
    // Entry 1: Cash sale — DR Cash 1000, CR Revenue 1000
    const entry1 = await request(app)
      .post("/api/v1/journal-entries")
      .send({
        entryDate: "2024-06-01",
        referenceNumber: "LEDGER-REF-001",
        description: "Cash sale for ledger test",
        lines: [
          {
            accountId: testCashAccountId.toString(),
            accountCode: "1100",
            accountName: "Cash - Ledger Test",
            debit: 1000,
            credit: 0,
            description: "Cash received",
          },
          {
            accountId: testRevenueAccountId.toString(),
            accountCode: "4100",
            accountName: "Revenue - Ledger Test",
            debit: 0,
            credit: 1000,
            description: "Service revenue",
          },
        ],
      });

    postedEntryId = entry1.body.data._id;

    // Post entry 1 to create ledger entries
    await request(app).post(`/api/v1/journal-entries/${postedEntryId}/post`);

    // Entry 2: Office expense — DR Expense 250, CR Cash 250
    const entry2 = await request(app)
      .post("/api/v1/journal-entries")
      .send({
        entryDate: "2024-06-15",
        referenceNumber: "LEDGER-REF-002",
        description: "Office supplies purchase",
        lines: [
          {
            accountId: testExpenseAccountId.toString(),
            accountCode: "5100",
            accountName: "Expense - Ledger Test",
            debit: 250,
            credit: 0,
            description: "Office supplies",
          },
          {
            accountId: testCashAccountId.toString(),
            accountCode: "1100",
            accountName: "Cash - Ledger Test",
            debit: 0,
            credit: 250,
            description: "Cash payment",
          },
        ],
      });

    // Post entry 2
    await request(app).post(
      `/api/v1/journal-entries/${entry2.body.data._id}/post`,
    );
  });

  afterAll(async () => {
    const db = mongoClient.db();
    await db.collection("ledgers").deleteMany({});
    await db.collection("journalEntries").deleteMany({});
    await db.collection("accounts").deleteMany({
      _id: {
        $in: [testCashAccountId, testRevenueAccountId, testExpenseAccountId],
      },
    });
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({ _id: testUserId });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ALL LEDGER ENTRIES — GET /api/v1/ledger
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/ledger", () => {
    it("should list all ledger entries", async () => {
      const response = await request(app).get("/api/v1/ledger");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // 2 entries from entry1 + 2 entries from entry2 = 4
      expect(response.body.count).toBe(4);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/ledger");

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should support pagination with limit and skip", async () => {
      const response = await request(app)
        .get("/api/v1/ledger")
        .query({ limit: 2, skip: 0 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GENERAL LEDGER — GET /api/v1/ledger/general
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/ledger/general", () => {
    it("should return general ledger grouped by account", async () => {
      const response = await request(app).get("/api/v1/ledger/general");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // 3 accounts have entries
      expect(response.body.data.length).toBe(3);

      // Each group should have account info, entries, and summary
      response.body.data.forEach((group: any) => {
        expect(group.account).toBeDefined();
        expect(group.account.accountCode).toBeDefined();
        expect(group.account.accountName).toBeDefined();
        expect(group.account.accountType).toBeDefined();
        expect(Array.isArray(group.entries)).toBe(true);
        expect(group.entries.length).toBeGreaterThan(0);
        expect(group.summary).toBeDefined();
        expect(group.summary.totalDebit).toBeDefined();
        expect(group.summary.totalCredit).toBeDefined();
        expect(group.summary.balance).toBeDefined();
        expect(group.summary.entryCount).toBeDefined();
      });
    });

    it("should filter by date range", async () => {
      const response = await request(app).get("/api/v1/ledger/general").query({
        startDate: "2024-06-01",
        endDate: "2024-06-10",
      });

      expect(response.status).toBe(200);
      // Only entry1 (June 1) should be included — Cash + Revenue = 2 accounts
      expect(response.body.data.length).toBe(2);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/ledger/general");

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY ACCOUNT — GET /api/v1/ledger/account/:accountId
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/ledger/account/:accountId", () => {
    it("should return ledger entries for a specific account", async () => {
      const response = await request(app).get(
        `/api/v1/ledger/account/${testCashAccountId.toString()}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.account).toBeDefined();
      expect(response.body.data.account.accountCode).toBe("1100");
      expect(response.body.data.account.accountName).toBe("Cash - Ledger Test");
      expect(response.body.data.account.accountType).toBe("Asset");

      // Cash had 2 transactions: +1000 and -250
      expect(response.body.data.entries).toHaveLength(2);
      expect(response.body.data.summary.totalDebit).toBe(1000);
      expect(response.body.data.summary.totalCredit).toBe(250);
      expect(response.body.data.summary.currentBalance).toBe(750); // 1000 - 250
      expect(response.body.data.summary.entryCount).toBe(2);
    });

    it("should filter account entries by date range", async () => {
      const response = await request(app)
        .get(`/api/v1/ledger/account/${testCashAccountId.toString()}`)
        .query({
          startDate: "2024-06-01",
          endDate: "2024-06-10",
        });

      expect(response.status).toBe(200);
      // Only 1 Cash entry in this date range (entry1)
      expect(response.body.data.entries).toHaveLength(1);
      expect(response.body.data.summary.totalDebit).toBe(1000);
    });

    it("should return error for non-existent account", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(
        `/api/v1/ledger/account/${fakeId}`,
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get(
        `/api/v1/ledger/account/${testCashAccountId.toString()}`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY JOURNAL ENTRY — GET /api/v1/ledger/journal-entry/:journalEntryId
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/ledger/journal-entry/:journalEntryId", () => {
    it("should return ledger entries for a specific journal entry", async () => {
      const response = await request(app).get(
        `/api/v1/ledger/journal-entry/${postedEntryId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // DR Cash + CR Revenue
      expect(response.body.count).toBe(2);

      // Verify the entries match the journal entry
      response.body.data.forEach((entry: any) => {
        expect(entry.journalEntryId).toBe(postedEntryId);
      });
    });

    it("should return empty for non-existent journal entry", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(
        `/api/v1/ledger/journal-entry/${fakeId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get(
        `/api/v1/ledger/journal-entry/${postedEntryId}`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY DATE RANGE — GET /api/v1/ledger/date-range
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/ledger/date-range", () => {
    it("should return entries within date range", async () => {
      const response = await request(app)
        .get("/api/v1/ledger/date-range")
        .query({
          startDate: "2024-06-01",
          endDate: "2024-06-30",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4); // All 4 entries
    });

    it("should return partial entries for narrower date range", async () => {
      const response = await request(app)
        .get("/api/v1/ledger/date-range")
        .query({
          startDate: "2024-06-10",
          endDate: "2024-06-20",
        });

      expect(response.status).toBe(200);
      // Only entry2 (June 15) entries — 2 lines
      expect(response.body.data).toHaveLength(2);
    });

    it("should require both startDate and endDate", async () => {
      const response = await request(app)
        .get("/api/v1/ledger/date-range")
        .query({ startDate: "2024-06-01" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("startDate and endDate are required");
    });

    it("should return empty for date range with no entries", async () => {
      const response = await request(app)
        .get("/api/v1/ledger/date-range")
        .query({
          startDate: "2020-01-01",
          endDate: "2020-12-31",
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ACCOUNT BALANCE — GET /api/v1/ledger/account/:accountId/balance
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/ledger/account/:accountId/balance", () => {
    it("should return current balance for cash account", async () => {
      const response = await request(app).get(
        `/api/v1/ledger/account/${testCashAccountId.toString()}/balance`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accountCode).toBe("1100");
      expect(response.body.data.accountName).toBe("Cash - Ledger Test");
      expect(response.body.data.accountType).toBe("Asset");
      expect(response.body.data.balance).toBe(750); // 1000 - 250
    });

    it("should return current balance for revenue account", async () => {
      const response = await request(app).get(
        `/api/v1/ledger/account/${testRevenueAccountId.toString()}/balance`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.balance).toBe(1000);
    });

    it("should return current balance for expense account", async () => {
      const response = await request(app).get(
        `/api/v1/ledger/account/${testExpenseAccountId.toString()}/balance`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.balance).toBe(250);
    });

    it("should support as-of date for historical balance", async () => {
      const response = await request(app)
        .get(`/api/v1/ledger/account/${testCashAccountId.toString()}/balance`)
        .query({ asOfDate: "2024-06-10" });

      expect(response.status).toBe(200);
      // As of June 10, only entry1 (June 1) posted — Cash balance is 1000
      expect(response.body.data.balance).toBe(1000);
    });

    it("should return zero balance for account with no ledger entries", async () => {
      // Create a new account with no entries
      const db = mongoClient.db();
      const emptyAccountId = new ObjectId();
      await db.collection("accounts").insertOne({
        _id: emptyAccountId,
        companyId: testCompanyId,
        accountCode: "9100",
        accountName: "Empty Account",
        accountType: "Asset",
        normalBalance: "Debit",
        balance: 0,
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app).get(
        `/api/v1/ledger/account/${emptyAccountId.toString()}/balance`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.balance).toBe(0);

      // Cleanup
      await db.collection("accounts").deleteOne({ _id: emptyAccountId });
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get(
        `/api/v1/ledger/account/${testCashAccountId.toString()}/balance`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // TRIAL BALANCE — GET /api/v1/ledger/trial-balance
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/ledger/trial-balance", () => {
    it("should return trial balance with all accounts that have activity", async () => {
      const response = await request(app).get("/api/v1/ledger/trial-balance");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toBeDefined();
      expect(response.body.data.totals).toBeDefined();

      // 3 accounts have balances
      expect(response.body.data.accounts.length).toBe(3);

      // Verify total debits equal total credits (balanced)
      expect(response.body.data.totals.balanced).toBe(true);
      expect(response.body.data.totals.difference).toBeLessThan(0.01);

      // Cash (Asset): debit 750, Expense: debit 250, Revenue: credit 1000
      // Total debits should equal total credits
      expect(response.body.data.totals.debits).toBe(1000); // 750 + 250
      expect(response.body.data.totals.credits).toBe(1000);
    });

    it("should verify individual account balances in trial balance", async () => {
      const response = await request(app).get("/api/v1/ledger/trial-balance");

      const cashAccount = response.body.data.accounts.find(
        (a: any) => a.accountCode === "1100",
      );
      expect(cashAccount).toBeDefined();
      expect(cashAccount.debit).toBe(750);
      expect(cashAccount.credit).toBe(0);

      const revenueAccount = response.body.data.accounts.find(
        (a: any) => a.accountCode === "4100",
      );
      expect(revenueAccount).toBeDefined();
      expect(revenueAccount.debit).toBe(0);
      expect(revenueAccount.credit).toBe(1000);

      const expenseAccount = response.body.data.accounts.find(
        (a: any) => a.accountCode === "5100",
      );
      expect(expenseAccount).toBeDefined();
      expect(expenseAccount.debit).toBe(250);
      expect(expenseAccount.credit).toBe(0);
    });

    it("should support as-of date for historical trial balance", async () => {
      const response = await request(app)
        .get("/api/v1/ledger/trial-balance")
        .query({ asOfDate: "2024-06-10" });

      expect(response.status).toBe(200);
      // As of June 10, only entry1 posted: Cash +1000, Revenue +1000
      // Expense would be 0 (entry2 was June 15)
      expect(response.body.data.totals.balanced).toBe(true);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/ledger/trial-balance");

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DOUBLE-ENTRY INTEGRITY — Cross-module verification
  // ═══════════════════════════════════════════════════════════════════
  describe("Double-Entry Integrity", () => {
    it("should have matching debit and credit totals across all ledger entries", async () => {
      const response = await request(app).get("/api/v1/ledger");

      let totalDebit = 0;
      let totalCredit = 0;
      response.body.data.forEach((entry: any) => {
        totalDebit += parseFloat(entry.debit);
        totalCredit += parseFloat(entry.credit);
      });

      expect(Math.abs(totalDebit - totalCredit)).toBeLessThan(0.01);
    });

    it("should link ledger entries back to their journal entries", async () => {
      const response = await request(app).get(
        `/api/v1/ledger/journal-entry/${postedEntryId}`,
      );

      expect(response.body.data.length).toBe(2);
      response.body.data.forEach((entry: any) => {
        expect(entry.journalEntryId).toBe(postedEntryId);
        expect(entry.entryNumber).toBeDefined();
        expect(entry.companyId).toBeDefined();
      });
    });

    it("should have running balances that reflect account type", async () => {
      // Cash (Asset/Debit-normal): debit increases, credit decreases
      const cashResponse = await request(app).get(
        `/api/v1/ledger/account/${testCashAccountId.toString()}`,
      );

      const cashEntries = cashResponse.body.data.entries;
      expect(cashEntries.length).toBe(2);

      // First entry: debit 1000, balance = 1000
      expect(parseFloat(cashEntries[0].debit)).toBe(1000);
      expect(cashEntries[0].runningBalance).toBe(1000);

      // Second entry: credit 250, balance = 750
      expect(parseFloat(cashEntries[1].credit)).toBe(250);
      expect(cashEntries[1].runningBalance).toBe(750);
    });
  });
});
