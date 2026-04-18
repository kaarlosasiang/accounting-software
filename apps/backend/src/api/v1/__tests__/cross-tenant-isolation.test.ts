/**
 * Cross-tenant data isolation tests.
 *
 * Verifies that authenticated requests scoped to Org A cannot read or
 * mutate data belonging to Org B, even when Org B's records exist in
 * the same database and collection.
 *
 * Strategy
 * --------
 * 1. Seed two organizations (A and B) with their own customers and accounts.
 * 2. Mock `authServer.api.getSession` to return a session for Org A.
 * 3. Make GET requests to list-endpoints.
 * 4. Assert that only Org A's records are returned and Org B's are absent.
 */

import request from "supertest";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  type MockInstance,
} from "vitest";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";

import configureApp from "../config/app.js";
import { constants } from "../config/index.js";
import { authServer } from "../modules/auth/betterAuth.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal mock session payload that getCompanyId() can read */
function makeSession(orgId: ObjectId, userId: ObjectId) {
  return {
    session: {
      id: new ObjectId().toHexString(),
      userId: userId.toHexString(),
      activeOrganizationId: orgId.toHexString(),
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    user: {
      id: userId.toHexString(),
      name: "Test User",
      email: `user-${userId.toHexString()}@example.com`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Cross-tenant data isolation", () => {
  let mongoClient: MongoClient;
  let app: express.Application;

  // IDs for two distinct tenants
  const orgAId = new ObjectId();
  const orgBId = new ObjectId();
  const userAId = new ObjectId();
  const userBId = new ObjectId();

  // Seeded record IDs so we can assert their absence / presence
  const customerAId = new ObjectId();
  const customerBId = new ObjectId();
  const accountAId = new ObjectId();
  const accountBId = new ObjectId();

  let getSessionMock: MockInstance;

  // ---------------------------------------------------------------------------
  // Setup / Teardown
  // ---------------------------------------------------------------------------

  beforeAll(async () => {
    app = express();
    configureApp(app);

    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db(constants.dbName);

    // Seed organizations
    await db.collection("organizations").insertMany([
      {
        _id: orgAId,
        name: "Org A",
        slug: `org-a-${orgAId.toHexString()}`,
        createdAt: new Date(),
      },
      {
        _id: orgBId,
        name: "Org B",
        slug: `org-b-${orgBId.toHexString()}`,
        createdAt: new Date(),
      },
    ]);

    // Seed users
    await db.collection("users").insertMany([
      {
        _id: userAId,
        name: "User A",
        email: `usera-${userAId.toHexString()}@example.com`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: userBId,
        name: "User B",
        email: `userb-${userBId.toHexString()}@example.com`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Seed customers — one per org
    await db.collection("customers").insertMany([
      {
        _id: customerAId,
        companyId: orgAId,
        name: "Customer for Org A",
        email: "cust-a@example.com",
        phone: "0000000001",
        address: {
          street: "1 A St",
          city: "City A",
          state: "ST",
          zipCode: "00001",
          country: "US",
        },
        currency: "USD",
        isActive: true,
        totalOutstanding: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: customerBId,
        companyId: orgBId,
        name: "Customer for Org B",
        email: "cust-b@example.com",
        phone: "0000000002",
        address: {
          street: "1 B St",
          city: "City B",
          state: "ST",
          zipCode: "00002",
          country: "US",
        },
        currency: "USD",
        isActive: true,
        totalOutstanding: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Seed accounts — one per org
    await db.collection("accounts").insertMany([
      {
        _id: accountAId,
        companyId: orgAId,
        accountCode: "9001",
        accountName: "Isolation Test Account A",
        accountType: "Asset",
        subType: "Current Asset",
        normalBalance: "debit",
        isActive: true,
        isSystemAccount: false,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: accountBId,
        companyId: orgBId,
        accountCode: "9002",
        accountName: "Isolation Test Account B",
        accountType: "Asset",
        subType: "Current Asset",
        normalBalance: "debit",
        isActive: true,
        isSystemAccount: false,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Default mock: authenticated as Org A
    getSessionMock = vi
      .spyOn(authServer.api, "getSession")
      .mockResolvedValue(makeSession(orgAId, userAId) as any);
  });

  afterAll(async () => {
    if (mongoClient) {
      const db = mongoClient.db(constants.dbName);
      await db
        .collection("organizations")
        .deleteMany({ _id: { $in: [orgAId, orgBId] } });
      await db
        .collection("users")
        .deleteMany({ _id: { $in: [userAId, userBId] } });
      await db
        .collection("customers")
        .deleteMany({ _id: { $in: [customerAId, customerBId] } });
      await db
        .collection("accounts")
        .deleteMany({ _id: { $in: [accountAId, accountBId] } });
      await mongoClient.close();
    }
    getSessionMock?.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // Customer isolation
  // ---------------------------------------------------------------------------

  describe("GET /api/v1/customers", () => {
    it("returns only Org A customers when authenticated as Org A", async () => {
      getSessionMock.mockResolvedValue(makeSession(orgAId, userAId) as any);

      const res = await request(app)
        .get("/api/v1/customers")
        .set("Authorization", "Bearer fake-token-org-a");

      expect(res.status).toBe(200);

      const ids: string[] = (
        res.body?.data ??
        res.body?.customers ??
        res.body ??
        []
      ).map((c: any) => c._id?.toString() ?? c.id?.toString());

      expect(ids).toContain(customerAId.toHexString());
      expect(ids).not.toContain(customerBId.toHexString());
    });

    it("returns only Org B customers when authenticated as Org B", async () => {
      getSessionMock.mockResolvedValue(makeSession(orgBId, userBId) as any);

      const res = await request(app)
        .get("/api/v1/customers")
        .set("Authorization", "Bearer fake-token-org-b");

      expect(res.status).toBe(200);

      const ids: string[] = (
        res.body?.data ??
        res.body?.customers ??
        res.body ??
        []
      ).map((c: any) => c._id?.toString() ?? c.id?.toString());

      expect(ids).toContain(customerBId.toHexString());
      expect(ids).not.toContain(customerAId.toHexString());
    });
  });

  // ---------------------------------------------------------------------------
  // Account isolation
  // ---------------------------------------------------------------------------

  describe("GET /api/v1/accounts", () => {
    it("returns only Org A accounts when authenticated as Org A", async () => {
      getSessionMock.mockResolvedValue(makeSession(orgAId, userAId) as any);

      const res = await request(app)
        .get("/api/v1/accounts")
        .set("Authorization", "Bearer fake-token-org-a");

      expect(res.status).toBe(200);

      const ids: string[] = (
        res.body?.data ??
        res.body?.accounts ??
        res.body ??
        []
      ).map((a: any) => a._id?.toString() ?? a.id?.toString());

      expect(ids).toContain(accountAId.toHexString());
      expect(ids).not.toContain(accountBId.toHexString());
    });

    it("returns only Org B accounts when authenticated as Org B", async () => {
      getSessionMock.mockResolvedValue(makeSession(orgBId, userBId) as any);

      const res = await request(app)
        .get("/api/v1/accounts")
        .set("Authorization", "Bearer fake-token-org-b");

      expect(res.status).toBe(200);

      const ids: string[] = (
        res.body?.data ??
        res.body?.accounts ??
        res.body ??
        []
      ).map((a: any) => a._id?.toString() ?? a.id?.toString());

      expect(ids).toContain(accountBId.toHexString());
      expect(ids).not.toContain(accountAId.toHexString());
    });
  });

  // ---------------------------------------------------------------------------
  // Customer detail by ID — cannot fetch another org's customer
  // ---------------------------------------------------------------------------

  describe("GET /api/v1/customers/:id — cross-org access denied", () => {
    it("cannot retrieve Org B's customer when authenticated as Org A", async () => {
      getSessionMock.mockResolvedValue(makeSession(orgAId, userAId) as any);

      const res = await request(app)
        .get(`/api/v1/customers/${customerBId.toHexString()}`)
        .set("Authorization", "Bearer fake-token-org-a");

      // Should be 404 (not found in org A's scope) or 403 — never 200 with data
      expect([404, 403]).toContain(res.status);
    });

    it("cannot retrieve Org A's customer when authenticated as Org B", async () => {
      getSessionMock.mockResolvedValue(makeSession(orgBId, userBId) as any);

      const res = await request(app)
        .get(`/api/v1/customers/${customerAId.toHexString()}`)
        .set("Authorization", "Bearer fake-token-org-b");

      expect([404, 403]).toContain(res.status);
    });
  });

  // ---------------------------------------------------------------------------
  // Unauthenticated requests should be rejected
  // ---------------------------------------------------------------------------

  describe("Unauthenticated request", () => {
    it("returns 401 when no session is present", async () => {
      getSessionMock.mockResolvedValue(null);

      const res = await request(app).get("/api/v1/customers");

      expect(res.status).toBe(401);
    });
  });
});
