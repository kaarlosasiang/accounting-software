import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

// Cast as any to avoid strict better-auth endpoint types
const mockedAuthServer = vi.mocked(authServer) as any;

describe("Accounts Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let createdAccountId: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data
    await db
      .collection("users")
      .deleteMany({ email: "test-accounts@example.com" });
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-accounts" });
    await db.collection("accounts").deleteMany({
      accountCode: { $in: ["1200", "1201", "2100", "3100", "4200", "5200"] },
    });

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Accounts Tests",
      slug: "test-company-accounts",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("users").insertOne({
      name: "Test User Accounts",
      email: "test-accounts@example.com",
      username: `test-user-accounts-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Mock authenticated session
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-accounts@example.com",
        name: "Test User Accounts",
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
    await db.collection("accounts").deleteMany({ companyId: testCompanyId });
    await db.collection("ledgers").deleteMany({ companyId: testCompanyId });
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({ _id: testUserId });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // CREATE ACCOUNT — POST /api/v1/accounts
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/accounts", () => {
    it("should create a new account", async () => {
      const response = await request(app).post("/api/v1/accounts").send({
        accountCode: "1200",
        accountName: "Petty Cash",
        accountType: "Asset",
        subType: "Current Asset",
        normalBalance: "Debit",
        description: "Petty cash account for small expenses",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Account created successfully");
      expect(response.body.data.accountCode).toBe("1200");
      expect(response.body.data.accountName).toBe("Petty Cash");
      expect(response.body.data.accountType).toBe("Asset");
      expect(response.body.data.normalBalance).toBe("Debit");
      expect(response.body.data.balance).toBe(0);
      expect(response.body.data.isActive).toBe(true);

      createdAccountId = response.body.data._id;
    });

    it("should reject duplicate account codes for the same company", async () => {
      const response = await request(app).post("/api/v1/accounts").send({
        accountCode: "1200",
        accountName: "Duplicate Petty Cash",
        accountType: "Asset",
        normalBalance: "Debit",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).post("/api/v1/accounts").send({
        accountCode: "9999",
        accountName: "Should Fail",
        accountType: "Asset",
        normalBalance: "Debit",
      });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should create accounts of each type", async () => {
      const types = [
        {
          code: "2100",
          name: "Short Term Loan",
          type: "Liability",
          normal: "Credit",
        },
        {
          code: "3100",
          name: "Owner Equity",
          type: "Equity",
          normal: "Credit",
        },
        {
          code: "4200",
          name: "Service Revenue",
          type: "Revenue",
          normal: "Credit",
        },
        {
          code: "5200",
          name: "Rent Expense",
          type: "Expense",
          normal: "Debit",
        },
      ];

      for (const t of types) {
        const response = await request(app).post("/api/v1/accounts").send({
          accountCode: t.code,
          accountName: t.name,
          accountType: t.type,
          normalBalance: t.normal,
        });

        expect(response.status).toBe(201);
        expect(response.body.data.accountType).toBe(t.type);
        expect(response.body.data.normalBalance).toBe(t.normal);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ALL ACCOUNTS — GET /api/v1/accounts
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/accounts", () => {
    it("should list all accounts", async () => {
      const response = await request(app).get("/api/v1/accounts");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(5); // 1200 + 4 types
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/accounts");

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ACCOUNT BY ID — GET /api/v1/accounts/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/accounts/:id", () => {
    it("should return a specific account", async () => {
      const response = await request(app).get(
        `/api/v1/accounts/${createdAccountId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(createdAccountId);
      expect(response.body.data.accountCode).toBe("1200");
    });

    it("should return 404 for non-existent account", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(`/api/v1/accounts/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY TYPE — GET /api/v1/accounts/type/:accountType
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/accounts/type/:accountType", () => {
    it("should return accounts of specified type", async () => {
      const response = await request(app).get("/api/v1/accounts/type/Asset");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((account: any) => {
        expect(account.accountType).toBe("Asset");
      });
    });

    it("should return empty for non-existent type", async () => {
      const response = await request(app).get(
        "/api/v1/accounts/type/NonExistent",
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // CHART OF ACCOUNTS — GET /api/v1/accounts/chart/view
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/accounts/chart/view", () => {
    it("should return chart of accounts grouped by type", async () => {
      const response = await request(app).get("/api/v1/accounts/chart/view");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("assets");
      expect(response.body.data).toHaveProperty("liabilities");
      expect(response.body.data).toHaveProperty("equity");
      expect(response.body.data).toHaveProperty("revenue");
      expect(response.body.data).toHaveProperty("expenses");

      expect(Array.isArray(response.body.data.assets)).toBe(true);
      expect(response.body.data.assets.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH ACCOUNTS — GET /api/v1/accounts/search
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/accounts/search", () => {
    it("should search accounts by name", async () => {
      const response = await request(app)
        .get("/api/v1/accounts/search")
        .query({ q: "Petty" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should search accounts by code", async () => {
      const response = await request(app)
        .get("/api/v1/accounts/search")
        .query({ q: "1200" });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should require search term", async () => {
      const response = await request(app).get("/api/v1/accounts/search");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Search term is required");
    });

    it("should return empty for no matches", async () => {
      const response = await request(app)
        .get("/api/v1/accounts/search")
        .query({ q: "zzzznonexistent" });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE ACCOUNT — PUT /api/v1/accounts/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("PUT /api/v1/accounts/:id", () => {
    it("should update an account", async () => {
      const response = await request(app)
        .put(`/api/v1/accounts/${createdAccountId}`)
        .send({
          accountName: "Updated Petty Cash",
          description: "Updated description",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Account updated successfully");
      expect(response.body.data.accountName).toBe("Updated Petty Cash");
      expect(response.body.data.description).toBe("Updated description");
    });

    it("should return 404 for non-existent account", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app)
        .put(`/api/v1/accounts/${fakeId}`)
        .send({ accountName: "Should Fail" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/v1/accounts/${createdAccountId}`)
        .send({ accountName: "Should Fail" });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ACCOUNT BALANCE — GET /api/v1/accounts/:id/balance
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/accounts/:id/balance", () => {
    it("should return account balance", async () => {
      const response = await request(app).get(
        `/api/v1/accounts/${createdAccountId}/balance`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accountCode).toBe("1200");
      expect(response.body.data.balance).toBe(0);
      expect(response.body.data.normalBalance).toBe("Debit");
    });

    it("should return 404 for non-existent account", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(
        `/api/v1/accounts/${fakeId}/balance`,
      );

      expect(response.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ARCHIVE / RESTORE — PUT /api/v1/accounts/:id/archive|restore
  // ═══════════════════════════════════════════════════════════════════
  describe("Archive and Restore", () => {
    it("should archive an account", async () => {
      const response = await request(app).put(
        `/api/v1/accounts/${createdAccountId}/archive`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Account archived successfully");
      expect(response.body.data.isActive).toBe(false);
    });

    it("should restore an archived account", async () => {
      const response = await request(app).put(
        `/api/v1/accounts/${createdAccountId}/restore`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Account restored successfully");
      expect(response.body.data.isActive).toBe(true);
    });

    it("should return 404 for non-existent account archive", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).put(
        `/api/v1/accounts/${fakeId}/archive`,
      );

      expect(response.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // RECONCILE — POST /api/v1/accounts/:id/reconcile
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/accounts/:id/reconcile", () => {
    it("should report account already in sync when no ledger entries", async () => {
      const response = await request(app).post(
        `/api/v1/accounts/${createdAccountId}/reconcile`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Balance = 0 and no ledger entries → "already in sync"
      expect(response.body.data.reconciled).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // RECONCILE ALL — POST /api/v1/accounts/reconcile-all
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/accounts/reconcile-all", () => {
    it("should reconcile all account balances", async () => {
      const response = await request(app).post(
        "/api/v1/accounts/reconcile-all",
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAccounts).toBeGreaterThanOrEqual(5);
      expect(response.body.data.reconciledCount).toBeDefined();
      expect(response.body.data.inSyncCount).toBeDefined();
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).post(
        "/api/v1/accounts/reconcile-all",
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE ACCOUNT — DELETE /api/v1/accounts/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("DELETE /api/v1/accounts/:id", () => {
    it("should delete an account with no transactions", async () => {
      // Create a throwaway account to delete
      const createRes = await request(app).post("/api/v1/accounts").send({
        accountCode: "1201",
        accountName: "Temporary Account",
        accountType: "Asset",
        normalBalance: "Debit",
      });
      const tempId = createRes.body.data._id;

      const response = await request(app).delete(`/api/v1/accounts/${tempId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Account deleted successfully");

      // Confirm it's gone
      const getRes = await request(app).get(`/api/v1/accounts/${tempId}`);
      expect(getRes.status).toBe(404);
    });

    it("should return 404 for non-existent account", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).delete(`/api/v1/accounts/${fakeId}`);

      expect(response.status).toBe(404);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const fakeId = new ObjectId().toString();
      const response = await request(app).delete(`/api/v1/accounts/${fakeId}`);

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });
});
