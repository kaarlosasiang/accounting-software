import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Company Settings Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let createdBankAccountId: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data
    await db
      .collection("users")
      .deleteMany({ email: "test-company-settings@example.com" });
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-settings" });
    await db
      .collection("companysettings")
      .deleteMany({ companyId: { $exists: true } });

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Settings Tests",
      slug: "test-company-settings",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("users").insertOne({
      name: "Test User Settings",
      email: "test-company-settings@example.com",
      username: `test-user-settings-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Mock authenticated session
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-company-settings@example.com",
        name: "Test User Settings",
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
    await db
      .collection("companysettings")
      .deleteMany({ companyId: testCompanyId });
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({ _id: testUserId });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET SETTINGS — GET /api/v1/company-settings
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/company-settings", () => {
    it("should return or create company settings", async () => {
      const response = await request(app).get("/api/v1/company-settings");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("companyId");
      expect(response.body.data).toHaveProperty("banking");
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/company-settings");

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADD BANK ACCOUNT — POST /api/v1/company-settings/banking/accounts
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/company-settings/banking/accounts", () => {
    it("should add a new bank account", async () => {
      const response = await request(app)
        .post("/api/v1/company-settings/banking/accounts")
        .send({
          bankName: "BDO Unibank",
          accountName: "Operating Account",
          accountNumber: "002-345-6789",
          accountType: "Checking",
          currency: "PHP",
          isActive: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.banking.accounts).toBeInstanceOf(Array);
      expect(response.body.data.banking.accounts.length).toBeGreaterThan(0);

      const account = response.body.data.banking.accounts.find(
        (a: any) => a.accountNumber === "002-345-6789",
      );
      expect(account).toBeDefined();
      expect(account.bankName).toBe("BDO Unibank");
      createdBankAccountId = account.id;
    });

    it("should require bankName, accountName, and accountNumber", async () => {
      const response = await request(app)
        .post("/api/v1/company-settings/banking/accounts")
        .send({
          bankName: "BDO Unibank",
          // missing accountName and accountNumber
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/company-settings/banking/accounts")
        .send({
          bankName: "BDO",
          accountName: "Savings",
          accountNumber: "000000000",
          accountType: "Savings",
          currency: "PHP",
          isActive: true,
        });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE BANK ACCOUNT — PUT /api/v1/company-settings/banking/accounts/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("PUT /api/v1/company-settings/banking/accounts/:id", () => {
    it("should update an existing bank account", async () => {
      const response = await request(app)
        .put(
          `/api/v1/company-settings/banking/accounts/${createdBankAccountId}`,
        )
        .send({
          bankName: "BDO Unibank - Updated",
          accountName: "Primary Operating Account",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updated = response.body.data.banking.accounts.find(
        (a: any) => a.id === createdBankAccountId,
      );
      expect(updated?.bankName).toBe("BDO Unibank - Updated");
    });

    it("should return 404 for non-existent account", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app)
        .put(`/api/v1/company-settings/banking/accounts/${fakeId}`)
        .send({ bankName: "Ghost Bank" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE BANK ACCOUNT — DELETE /api/v1/company-settings/banking/accounts/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("DELETE /api/v1/company-settings/banking/accounts/:id", () => {
    it("should remove a bank account", async () => {
      const response = await request(app).delete(
        `/api/v1/company-settings/banking/accounts/${createdBankAccountId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify it's gone
      const settingsResponse = await request(app).get(
        "/api/v1/company-settings",
      );
      const remaining = settingsResponse.body.data.banking.accounts.find(
        (a: any) => a.id === createdBankAccountId,
      );
      expect(remaining).toBeUndefined();
    });

    it("should return 404 for already-deleted account", async () => {
      const response = await request(app).delete(
        `/api/v1/company-settings/banking/accounts/${createdBankAccountId}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
