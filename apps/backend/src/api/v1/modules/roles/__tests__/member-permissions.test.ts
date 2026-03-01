import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Member Permissions API", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testAdminId: ObjectId;
  let targetUserId: ObjectId;
  let staffRoleId: ObjectId;

  beforeAll(async () => {
    app = express();
    configureApp(app);

    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-memberperms" });
    await db.collection("users").deleteMany({
      email: {
        $in: ["test-admin-mp@example.com", "target-user-mp@example.com"],
      },
    });
    await db.collection("roles").deleteMany({ name: "Test Staff Role" });

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Member Perms Tests",
      slug: "test-company-memberperms",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create admin user (makes requests)
    const adminResult = await db.collection("users").insertOne({
      name: "Admin User MP",
      email: "test-admin-mp@example.com",
      username: `admin-mp-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
    });
    testAdminId = adminResult.insertedId;

    // Create target user (subject of permission operations)
    const targetResult = await db.collection("users").insertOne({
      name: "Target User MP",
      email: "target-user-mp@example.com",
      username: `target-mp-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
    });
    targetUserId = targetResult.insertedId;

    // Seed a custom staff-like role for test use
    const roleResult = await db.collection("roles").insertOne({
      name: "Test Staff Role",
      description: "Staff role for testing",
      companyId: testCompanyId,
      isSystem: false,
      permissions: [
        { resource: "invoice", actions: ["read", "create", "update"] },
        {
          resource: "customer",
          actions: ["read", "create", "update", "delete"],
        },
        { resource: "journalEntry", actions: [] }, // no access
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    staffRoleId = roleResult.insertedId;

    // Mock admin session
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testAdminId.toString(),
        email: "test-admin-mp@example.com",
        role: "admin",
      },
      session: {
        activeOrganizationId: testCompanyId.toString(),
      },
    });
  });

  afterAll(async () => {
    const db = mongoClient.db();
    await db.collection("member_permissions").deleteMany({
      organizationId: testCompanyId.toString(),
    });
    await db.collection("roles").deleteMany({ _id: staffRoleId });
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({
      _id: { $in: [testAdminId, targetUserId] },
    });
    await mongoClient.close();
  });

  // ── GET /members/:userId/permissions (no record yet) ─────────────────────

  describe("GET /api/v1/members/:userId/permissions — no record", () => {
    it("returns 404 when the user has no permission record", async () => {
      const res = await request(app).get(
        `/api/v1/members/${targetUserId.toString()}/permissions`,
      );
      expect(res.status).toBe(404);
    });
  });

  // ── PUT /members/:userId/permissions ─────────────────────────────────────

  describe("PUT /api/v1/members/:userId/permissions — assign role", () => {
    it("assigns a role to the member (upsert)", async () => {
      const res = await request(app)
        .put(`/api/v1/members/${targetUserId.toString()}/permissions`)
        .send({
          roleId: staffRoleId.toString(),
          grants: [],
          revocations: [],
        });

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(targetUserId.toString());
      expect(res.body.organizationId).toBe(testCompanyId.toString());
    });

    it("re-assigns with grants and revocations", async () => {
      const res = await request(app)
        .put(`/api/v1/members/${targetUserId.toString()}/permissions`)
        .send({
          roleId: staffRoleId.toString(),
          grants: [{ resource: "journalEntry", actions: ["read"] }],
          revocations: [{ resource: "invoice", actions: ["update"] }],
        });

      expect(res.status).toBe(200);
      expect(res.body.grants).toHaveLength(1);
      expect(res.body.grants[0].resource).toBe("journalEntry");
      expect(res.body.revocations).toHaveLength(1);
      expect(res.body.revocations[0].resource).toBe("invoice");
    });
  });

  // ── GET /members/:userId/permissions ─────────────────────────────────────

  describe("GET /api/v1/members/:userId/permissions", () => {
    it("returns the raw permission record with the populated role", async () => {
      const res = await request(app).get(
        `/api/v1/members/${targetUserId.toString()}/permissions`,
      );

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(targetUserId.toString());
      expect(res.body.roleId).toBeTruthy(); // populated role object
    });
  });

  // ── GET /members/:userId/permissions/effective ────────────────────────────

  describe("GET /api/v1/members/:userId/permissions/effective", () => {
    it("returns the resolved effective permission set", async () => {
      // Setup: assign role with grant (journalEntry.read) + revocation (invoice.update)
      await request(app)
        .put(`/api/v1/members/${targetUserId.toString()}/permissions`)
        .send({
          roleId: staffRoleId.toString(),
          grants: [{ resource: "journalEntry", actions: ["read"] }],
          revocations: [{ resource: "invoice", actions: ["update"] }],
        });

      const res = await request(app).get(
        `/api/v1/members/${targetUserId.toString()}/permissions/effective`,
      );

      expect(res.status).toBe(200);
      // invoices: base has read+create+update, revoked update → should have read+create
      expect(res.body.invoice).toEqual(
        expect.arrayContaining(["read", "create"]),
      );
      expect(res.body.invoice).not.toContain("update");
      // journalEntry: base had [] but granted read
      expect(res.body.journalEntry).toContain("read");
      expect(res.body.journalEntry).not.toContain("create");
      // customer: full access from base role
      expect(res.body.customer).toEqual(
        expect.arrayContaining(["read", "create", "update", "delete"]),
      );
    });
  });

  // ── PATCH /members/:userId/permissions/overrides ──────────────────────────

  describe("PATCH /api/v1/members/:userId/permissions/overrides", () => {
    it("updates only grants/revocations without changing the role", async () => {
      const res = await request(app)
        .patch(
          `/api/v1/members/${targetUserId.toString()}/permissions/overrides`,
        )
        .send({
          grants: [{ resource: "journalEntry", actions: ["read", "create"] }],
          revocations: [],
        });

      expect(res.status).toBe(200);
      expect(res.body.grants[0].actions).toEqual(
        expect.arrayContaining(["read", "create"]),
      );
      expect(res.body.revocations).toHaveLength(0);
    });

    it("returns 500 when patching a user with no existing permission record", async () => {
      const ghostId = new ObjectId().toString();
      const res = await request(app)
        .patch(`/api/v1/members/${ghostId}/permissions/overrides`)
        .send({ grants: [] });

      expect(res.status).toBe(500);
    });
  });

  // ── Auth guard ────────────────────────────────────────────────────────────

  describe("Auth guard", () => {
    it("returns 401 when unauthenticated", async () => {
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const res = await request(app).get(
        `/api/v1/members/${targetUserId.toString()}/permissions`,
      );
      expect(res.status).toBe(401);

      // Restore mock
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
        user: {
          id: testAdminId.toString(),
          email: "test-admin-mp@example.com",
          role: "admin",
        },
        session: { activeOrganizationId: testCompanyId.toString() },
      });
    });
  });
});
