import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Roles API", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let createdRoleId: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);

    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-roles" });
    await db
      .collection("users")
      .deleteMany({ email: "test-roles@example.com" });
    await db.collection("roles").deleteMany({ name: /^Test Role/ });

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Roles Tests",
      slug: "test-company-roles",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("users").insertOne({
      name: "Test User Roles",
      email: "test-roles@example.com",
      username: `test-user-roles-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Mock admin session — bypasses all requirePermission guards
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-roles@example.com",
        name: "Test User Roles",
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
      .collection("roles")
      .deleteMany({ companyId: testCompanyId, isSystem: { $ne: true } });
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({ _id: testUserId });
    await mongoClient.close();
  });

  // ── GET /roles/defaults ───────────────────────────────────────────────────

  describe("GET /api/v1/roles/defaults", () => {
    it("returns the default permission map for all system roles", async () => {
      const res = await request(app).get("/api/v1/roles/defaults");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("owner");
      expect(res.body).toHaveProperty("admin");
      expect(res.body).toHaveProperty("accountant");
      expect(res.body).toHaveProperty("staff");
      expect(res.body).toHaveProperty("viewer");
    });

    it("each role in defaults has permission keys for all resources", async () => {
      const res = await request(app).get("/api/v1/roles/defaults");

      const resources = [
        "accounts",
        "journalEntry",
        "invoice",
        "bill",
        "payment",
        "customer",
        "supplier",
        "inventory",
        "report",
        "ledger",
        "companySetting",
        "user",
        "period",
        "role",
      ];

      for (const role of Object.keys(res.body)) {
        for (const resource of resources) {
          expect(res.body[role]).toHaveProperty(resource);
        }
      }
    });
  });

  // ── GET /roles ────────────────────────────────────────────────────────────

  describe("GET /api/v1/roles", () => {
    it("returns 200 with an array of roles", async () => {
      const res = await request(app).get("/api/v1/roles");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("includes system roles in the list", async () => {
      const res = await request(app).get("/api/v1/roles");
      const roleNames = res.body.map((r: any) => r.name);
      expect(roleNames).toContain("owner");
      expect(roleNames).toContain("accountant");
      expect(roleNames).toContain("staff");
    });
  });

  // ── POST /roles ───────────────────────────────────────────────────────────

  describe("POST /api/v1/roles", () => {
    it("creates a new custom role for the company", async () => {
      const res = await request(app)
        .post("/api/v1/roles")
        .send({
          name: "Test Role Senior Accountant",
          description: "Senior level accountant with extra perms",
          permissions: [
            { resource: "invoice", actions: ["read", "create", "update"] },
            { resource: "report", actions: ["read"] },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Role Senior Accountant");
      expect(res.body.isSystem).toBe(false);
      expect(res.body.companyId).toBeTruthy();
      createdRoleId = res.body.id ?? res.body._id;
    });

    it("rejects a duplicate role name within the same company", async () => {
      const res = await request(app).post("/api/v1/roles").send({
        name: "Test Role Senior Accountant",
        permissions: [],
      });

      expect(res.status).toBe(500); // service throws Error, caught by global handler
    });
  });

  // ── GET /roles/:id ────────────────────────────────────────────────────────

  describe("GET /api/v1/roles/:id", () => {
    it("returns the role by ID", async () => {
      const res = await request(app).get(`/api/v1/roles/${createdRoleId}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Test Role Senior Accountant");
    });

    it("returns 500 for a non-existent role ID", async () => {
      const fakeId = new ObjectId().toString();
      const res = await request(app).get(`/api/v1/roles/${fakeId}`);
      expect(res.status).toBe(500);
    });
  });

  // ── PUT /roles/:id ────────────────────────────────────────────────────────

  describe("PUT /api/v1/roles/:id", () => {
    it("updates a custom role", async () => {
      const res = await request(app)
        .put(`/api/v1/roles/${createdRoleId}`)
        .send({
          description: "Updated description",
          permissions: [{ resource: "invoice", actions: ["read"] }],
        });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe("Updated description");
    });

    it("blocks updating a system role", async () => {
      // First get a system role ID
      const rolesRes = await request(app).get("/api/v1/roles");
      const owner = rolesRes.body.find(
        (r: any) => r.name === "owner" && r.isSystem,
      );
      if (!owner) return; // system not yet seeded — skip

      const res = await request(app)
        .put(`/api/v1/roles/${owner.id ?? owner._id}`)
        .send({ description: "Hacked" });

      expect(res.status).toBe(500); // service throws "System roles cannot be modified"
    });
  });

  // ── DELETE /roles/:id ─────────────────────────────────────────────────────

  describe("DELETE /api/v1/roles/:id", () => {
    it("deletes a custom role", async () => {
      const res = await request(app).delete(`/api/v1/roles/${createdRoleId}`);
      expect(res.status).toBe(204);
    });

    it("returns 500 when trying to delete a system role", async () => {
      const rolesRes = await request(app).get("/api/v1/roles");
      const staff = rolesRes.body.find(
        (r: any) => r.name === "staff" && r.isSystem,
      );
      if (!staff) return;

      const res = await request(app).delete(
        `/api/v1/roles/${staff.id ?? staff._id}`,
      );
      expect(res.status).toBe(500);
    });
  });

  // ── Auth guard ────────────────────────────────────────────────────────────

  describe("Auth guard", () => {
    it("returns 401 when unauthenticated", async () => {
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const res = await request(app).get("/api/v1/roles");
      expect(res.status).toBe(401);

      // Restore mock
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
        user: {
          id: testUserId.toString(),
          email: "test-roles@example.com",
          role: "admin",
        },
        session: { activeOrganizationId: testCompanyId.toString() },
      });
    });
  });
});
