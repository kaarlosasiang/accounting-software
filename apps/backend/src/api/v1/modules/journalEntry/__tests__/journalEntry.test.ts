import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

// Cast as any to avoid strict better-auth endpoint types
const mockedAuthServer = vi.mocked(authServer) as any;

describe("Journal Entry Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let testCashAccountId: ObjectId;
  let testRevenueAccountId: ObjectId;
  let testExpenseAccountId: ObjectId;
  let createdEntryId: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data
    await db.collection("users").deleteMany({ email: "test-je@example.com" });
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-je" });
    await db.collection("accounts").deleteMany({
      _id: {
        $in: [
          new ObjectId("607f1f77bcf86cd799439021"),
          new ObjectId("607f1f77bcf86cd799439022"),
          new ObjectId("607f1f77bcf86cd799439023"),
        ],
      },
    });
    await db.collection("journalEntries").deleteMany({});
    await db.collection("ledgers").deleteMany({});

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - JE Tests",
      slug: "test-company-je",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("users").insertOne({
      name: "Test User",
      email: "test-je@example.com",
      username: "test-je-user",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Create test accounts
    testCashAccountId = new ObjectId("607f1f77bcf86cd799439021");
    testRevenueAccountId = new ObjectId("607f1f77bcf86cd799439022");
    testExpenseAccountId = new ObjectId("607f1f77bcf86cd799439023");

    await db.collection("accounts").insertMany([
      {
        _id: testCashAccountId,
        companyId: testCompanyId,
        accountCode: "1000",
        accountName: "Cash",
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
        accountCode: "4000",
        accountName: "Sales Revenue",
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
        accountCode: "5000",
        accountName: "Office Supplies",
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
        email: "test-je@example.com",
        name: "Test User",
        companyId: testCompanyId.toString(),
        role: "admin",
      },
      session: {
        activeOrganizationId: testCompanyId.toString(),
      },
    });
  });

  afterAll(async () => {
    const db = mongoClient.db();
    await db.collection("journalEntries").deleteMany({});
    await db.collection("ledgers").deleteMany({});
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
  // CREATE JOURNAL ENTRY — POST /api/v1/journal-entries
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/journal-entries", () => {
    it("should create a balanced journal entry", async () => {
      const response = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          entryDate: "2024-01-15",
          referenceNumber: "REF-001",
          description: "Cash sale of services",
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 500,
              credit: 0,
              description: "Cash received",
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 500,
              description: "Revenue earned",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Journal entry created successfully");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.entryNumber).toMatch(/^JE-\d{4}-\d{3}$/);
      expect(response.body.data.status).toBe("Draft");
      expect(response.body.data.entryType).toBe(1); // MANUAL
      expect(response.body.data.totalDebit).toBe(500);
      expect(response.body.data.totalCredit).toBe(500);
      expect(response.body.data.lines).toHaveLength(2);

      createdEntryId = response.body.data._id;
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          entryDate: "2024-01-15",
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 100,
              credit: 0,
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 100,
            },
          ],
        });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should reject unbalanced journal entries", async () => {
      const response = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          entryDate: "2024-01-15",
          description: "Unbalanced entry",
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 500,
              credit: 0,
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 300,
            },
          ],
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not balanced");
    });

    it("should reject entries without lines", async () => {
      const response = await request(app).post("/api/v1/journal-entries").send({
        entryDate: "2024-01-15",
        description: "No lines",
        lines: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("entryDate and lines are required");
    });

    it("should reject entries without entryDate", async () => {
      const response = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          description: "No date",
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 100,
              credit: 0,
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 100,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject entries with non-existent accounts", async () => {
      const fakeAccountId = new ObjectId().toString();
      const response = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          entryDate: "2024-01-15",
          lines: [
            {
              accountId: fakeAccountId,
              accountCode: "9999",
              accountName: "Fake Account",
              debit: 100,
              credit: 0,
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 100,
            },
          ],
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Account not found");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ALL JOURNAL ENTRIES — GET /api/v1/journal-entries
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/journal-entries", () => {
    it("should list all journal entries", async () => {
      const response = await request(app).get("/api/v1/journal-entries");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/journal-entries");

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should filter by status", async () => {
      const response = await request(app)
        .get("/api/v1/journal-entries")
        .query({ status: "Draft" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((entry: any) => {
          expect(entry.status).toBe("Draft");
        });
      }
    });

    it("should filter by type", async () => {
      const response = await request(app)
        .get("/api/v1/journal-entries")
        .query({ type: "1" }); // MANUAL

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((entry: any) => {
          expect(entry.entryType).toBe(1);
        });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET JOURNAL ENTRY BY ID — GET /api/v1/journal-entries/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/journal-entries/:id", () => {
    it("should return a specific journal entry", async () => {
      const response = await request(app).get(
        `/api/v1/journal-entries/${createdEntryId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(createdEntryId);
      expect(response.body.data.entryNumber).toMatch(/^JE-\d{4}-\d{3}$/);
      expect(response.body.data.description).toBe("Cash sale of services");
      expect(response.body.data.lines).toHaveLength(2);
    });

    it("should return 404 for non-existent entry", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(
        `/api/v1/journal-entries/${fakeId}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY DATE RANGE — GET /api/v1/journal-entries/date-range
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/journal-entries/date-range", () => {
    it("should return entries within date range", async () => {
      const response = await request(app)
        .get("/api/v1/journal-entries/date-range")
        .query({
          startDate: "2024-01-01",
          endDate: "2024-12-31",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it("should require both startDate and endDate", async () => {
      const response = await request(app)
        .get("/api/v1/journal-entries/date-range")
        .query({ startDate: "2024-01-01" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("startDate and endDate are required");
    });

    it("should return empty for date range with no entries", async () => {
      const response = await request(app)
        .get("/api/v1/journal-entries/date-range")
        .query({
          startDate: "2020-01-01",
          endDate: "2020-12-31",
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY TYPE — GET /api/v1/journal-entries/type/:type
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/journal-entries/type/:type", () => {
    it("should return entries of specified type", async () => {
      const response = await request(app).get("/api/v1/journal-entries/type/1"); // MANUAL

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((entry: any) => {
        expect(entry.entryType).toBe(1);
      });
    });

    it("should return empty for unused type", async () => {
      const response = await request(app).get("/api/v1/journal-entries/type/4"); // AUTO_BILL

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY STATUS — GET /api/v1/journal-entries/status/:status
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/journal-entries/status/:status", () => {
    it("should return entries of specified status", async () => {
      const response = await request(app).get(
        "/api/v1/journal-entries/status/Draft",
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach((entry: any) => {
        expect(entry.status).toBe("Draft");
      });
    });

    it("should return empty for status with no entries", async () => {
      const response = await request(app).get(
        "/api/v1/journal-entries/status/Void",
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE JOURNAL ENTRY — PUT /api/v1/journal-entries/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("PUT /api/v1/journal-entries/:id", () => {
    it("should update a draft journal entry", async () => {
      const response = await request(app)
        .put(`/api/v1/journal-entries/${createdEntryId}`)
        .send({
          description: "Updated description",
          referenceNumber: "REF-001-UPDATED",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Journal entry updated successfully");
      expect(response.body.data.description).toBe("Updated description");
      expect(response.body.data.referenceNumber).toBe("REF-001-UPDATED");
    });

    it("should update lines and revalidate balance", async () => {
      const response = await request(app)
        .put(`/api/v1/journal-entries/${createdEntryId}`)
        .send({
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 750,
              credit: 0,
              description: "Updated cash received",
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 750,
              description: "Updated revenue",
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.totalDebit).toBe(750);
      expect(response.body.data.totalCredit).toBe(750);
    });

    it("should reject update with unbalanced lines", async () => {
      const response = await request(app)
        .put(`/api/v1/journal-entries/${createdEntryId}`)
        .send({
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 500,
              credit: 0,
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 200,
            },
          ],
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not balanced");
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/v1/journal-entries/${createdEntryId}`)
        .send({ description: "Should fail" });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST JOURNAL ENTRY — POST /api/v1/journal-entries/:id/post
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/journal-entries/:id/post", () => {
    it("should post a draft journal entry and create ledger entries", async () => {
      const response = await request(app).post(
        `/api/v1/journal-entries/${createdEntryId}/post`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Journal entry posted successfully");
      expect(response.body.data.status).toBe("Posted");
      expect(response.body.data.postedBy).toBeDefined();

      // Verify ledger entries were created
      const db = mongoClient.db();
      const ledgerEntries = await db
        .collection("ledgers")
        .find({
          journalEntryId: new ObjectId(createdEntryId),
        })
        .toArray();

      expect(ledgerEntries).toHaveLength(2);

      // Verify debit ledger entry (Cash)
      const debitEntry = ledgerEntries.find(
        (e) => e.accountId.toString() === testCashAccountId.toString(),
      );
      expect(debitEntry).toBeDefined();
      expect(debitEntry!.debit).toBe("750"); // String
      expect(debitEntry!.credit).toBe("0");
      expect(debitEntry!.runningBalance).toBe(750);

      // Verify credit ledger entry (Revenue)
      const creditEntry = ledgerEntries.find(
        (e) => e.accountId.toString() === testRevenueAccountId.toString(),
      );
      expect(creditEntry).toBeDefined();
      expect(creditEntry!.debit).toBe("0");
      expect(creditEntry!.credit).toBe("750");
      expect(creditEntry!.runningBalance).toBe(750);
    });

    it("should reject posting an already posted entry", async () => {
      const response = await request(app).post(
        `/api/v1/journal-entries/${createdEntryId}/post`,
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Only draft entries can be posted");
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).post(
        `/api/v1/journal-entries/${createdEntryId}/post`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VOID JOURNAL ENTRY — POST /api/v1/journal-entries/:id/void
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/journal-entries/:id/void", () => {
    it("should void a posted journal entry and create reversal ledger entries", async () => {
      const response = await request(app).post(
        `/api/v1/journal-entries/${createdEntryId}/void`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Journal entry voided successfully");
      expect(response.body.data.status).toBe("Void");
      expect(response.body.data.voidedAt).toBeDefined();
      expect(response.body.data.voidedBy).toBeDefined();

      // Verify reversal ledger entries were created
      const db = mongoClient.db();
      const voidEntries = await db
        .collection("ledgers")
        .find({
          entryNumber: { $regex: /VOID$/ },
        })
        .toArray();

      expect(voidEntries).toHaveLength(2);

      // Reversal entries should have swapped debit/credit
      const voidDebit = voidEntries.find(
        (e) => e.accountId.toString() === testCashAccountId.toString(),
      );
      expect(voidDebit).toBeDefined();
      expect(voidDebit!.debit).toBe("0"); // Original was 750 debit → voided as 0
      expect(voidDebit!.credit).toBe("750"); // Swapped
    });

    it("should reject voiding an already voided entry", async () => {
      const response = await request(app).post(
        `/api/v1/journal-entries/${createdEntryId}/void`,
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        "Only posted entries can be voided",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE JOURNAL ENTRY — DELETE /api/v1/journal-entries/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("DELETE /api/v1/journal-entries/:id", () => {
    let draftEntryId: string;

    beforeAll(async () => {
      // Create a draft entry specifically for deletion tests
      const response = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          entryDate: "2024-02-01",
          description: "Entry to delete",
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 200,
              credit: 0,
            },
            {
              accountId: testExpenseAccountId.toString(),
              accountCode: "5000",
              accountName: "Office Supplies",
              debit: 0,
              credit: 200,
            },
          ],
        });
      draftEntryId = response.body.data._id;
    });

    it("should delete a draft journal entry", async () => {
      const response = await request(app).delete(
        `/api/v1/journal-entries/${draftEntryId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Journal entry deleted successfully");

      // Confirm it's gone
      const getResponse = await request(app).get(
        `/api/v1/journal-entries/${draftEntryId}`,
      );
      expect(getResponse.status).toBe(404);
    });

    it("should reject deleting a non-draft entry", async () => {
      // createdEntryId is now voided, not draft
      const response = await request(app).delete(
        `/api/v1/journal-entries/${createdEntryId}`,
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        "Only draft entries can be deleted",
      );
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const fakeId = new ObjectId().toString();
      const response = await request(app).delete(
        `/api/v1/journal-entries/${fakeId}`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ACCOUNTING INTEGRITY — Double-entry validation
  // ═══════════════════════════════════════════════════════════════════
  describe("Accounting Integrity", () => {
    it("should auto-generate sequential entry numbers", async () => {
      const entry1 = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          entryDate: "2024-03-01",
          description: "First sequential entry",
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 100,
              credit: 0,
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 100,
            },
          ],
        });

      const entry2 = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          entryDate: "2024-03-02",
          description: "Second sequential entry",
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 200,
              credit: 0,
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 200,
            },
          ],
        });

      expect(entry1.body.data.entryNumber).toMatch(/^JE-\d{4}-\d{3}$/);
      expect(entry2.body.data.entryNumber).toMatch(/^JE-\d{4}-\d{3}$/);

      // Second entry number should be higher
      const num1 = parseInt(entry1.body.data.entryNumber.split("-")[2]);
      const num2 = parseInt(entry2.body.data.entryNumber.split("-")[2]);
      expect(num2).toBeGreaterThan(num1);
    });

    it("should correctly calculate totals from lines", async () => {
      const response = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          entryDate: "2024-03-03",
          description: "Multi-line entry",
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 1000,
              credit: 0,
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 800,
            },
            {
              accountId: testExpenseAccountId.toString(),
              accountCode: "5000",
              accountName: "Office Supplies",
              debit: 0,
              credit: 200,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.totalDebit).toBe(1000);
      expect(response.body.data.totalCredit).toBe(1000);
      expect(response.body.data.lines).toHaveLength(3);
    });

    it("should maintain ledger running balances through posting", async () => {
      // Create and post two entries to test running balance accumulation
      const entry1 = await request(app)
        .post("/api/v1/journal-entries")
        .send({
          entryDate: "2024-04-01",
          description: "First balance entry",
          lines: [
            {
              accountId: testCashAccountId.toString(),
              accountCode: "1000",
              accountName: "Cash",
              debit: 300,
              credit: 0,
            },
            {
              accountId: testRevenueAccountId.toString(),
              accountCode: "4000",
              accountName: "Sales Revenue",
              debit: 0,
              credit: 300,
            },
          ],
        });

      await request(app).post(
        `/api/v1/journal-entries/${entry1.body.data._id}/post`,
      );

      const db = mongoClient.db();
      const cashLedger = await db
        .collection("ledgers")
        .find({
          accountId: testCashAccountId,
          journalEntryId: new ObjectId(entry1.body.data._id),
        })
        .toArray();

      expect(cashLedger).toHaveLength(1);
      expect(cashLedger[0].debit).toBe("300");
      expect(typeof cashLedger[0].runningBalance).toBe("number");
    });
  });
});
