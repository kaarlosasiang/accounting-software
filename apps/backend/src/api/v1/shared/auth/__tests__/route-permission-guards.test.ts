/**
 * Route Permission Guards Integration Tests
 *
 * Verifies that `requirePermission` middleware correctly allows / blocks
 * requests based on the requesting user's effective permissions.
 *
 * Approach:
 *   - Use a non-admin session (role: "user") so the admin bypass does NOT kick in
 *   - Seed a Role and MemberPermission record in the DB for the test user
 *   - Confirm 403 is returned when the action is not in the effective permissions
 *   - Confirm 200 (or non-403) is returned when the action is allowed
 */
import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Route Permission Guards (requirePermission middleware)", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;

  /**
   * Seed helper — creates a Role + MemberPermission in the DB for testUserId.
   * Returns the inserted role _id.
   */
  async function seedMemberWithPermissions(
    db: any,
    permissions: { resource: string; actions: string[] }[],
    grants: { resource: string; actions: string[] }[] = [],
    revocations: { resource: string; actions: string[] }[] = [],
  ): Promise<ObjectId> {
    // Upsert the role
    const roleResult = await db.collection("roles").findOneAndUpdate(
      { name: "__test_guard_role__", companyId: testCompanyId },
      {
        $set: {
          name: "__test_guard_role__",
          description: "Role for guard tests",
          companyId: testCompanyId,
          isSystem: false,
          permissions,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    const roleId = roleResult._id as ObjectId;

    // Upsert the member permission record
    await db.collection("memberpermissions").findOneAndUpdate(
      {
        userId: testUserId.toString(),
        organizationId: testCompanyId.toString(),
      },
      {
        $set: {
          userId: testUserId.toString(),
          organizationId: testCompanyId.toString(),
          roleId,
          grants,
          revocations,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return roleId;
  }

  beforeAll(async () => {
    app = express();
    configureApp(app);

    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-guards" });
    await db
      .collection("users")
      .deleteMany({ email: "test-guard@example.com" });
    await db.collection("roles").deleteMany({ name: "__test_guard_role__" });

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Guard Tests",
      slug: "test-company-guards",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user with NON-admin global role
    const userResult = await db.collection("users").insertOne({
      name: "Guard Test User",
      email: "test-guard@example.com",
      username: `guard-user-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // NON-admin session — requirePermission will do a real DB lookup
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-guard@example.com",
        role: "user", // NOT admin — won't bypass permission checks
      },
      session: {
        activeOrganizationId: testCompanyId.toString(),
      },
    });
  });

  afterAll(async () => {
    const db = mongoClient.db();
    await db.collection("memberpermissions").deleteMany({
      organizationId: testCompanyId.toString(),
    });
    await db.collection("roles").deleteMany({ name: "__test_guard_role__" });
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({ _id: testUserId });
    await mongoClient.close();
  });

  // ── Auto-assign when no MemberPermission record exists ──────────────────

  describe("No permission record", () => {
    it("auto-assigns owner role and allows GET /invoices when user has no permission record", async () => {
      const res = await request(app).get("/api/v1/invoices");
      // Auto-assign gives owner permissions — permission check passes (not 403)
      expect(res.status).not.toBe(403);
    });

    it("auto-assigns owner role and allows POST /invoices when user has no permission record", async () => {
      const res = await request(app).post("/api/v1/invoices").send({});
      // Auto-assign gives owner permissions — permission check passes (not 403)
      // May be 400/422 due to business logic, but not a permission denial
      expect(res.status).not.toBe(403);
    });
  });

  // ── Staff-like permissions ────────────────────────────────────────────────

  describe("Staff-like permissions (invoice CRU, no journalEntry)", () => {
    beforeAll(async () => {
      const db = mongoClient.db();
      await seedMemberWithPermissions(db, [
        { resource: "invoice", actions: ["read", "create", "update"] },
        {
          resource: "customer",
          actions: ["read", "create", "update", "delete"],
        },
        { resource: "journalEntry", actions: [] },
      ]);
    });

    it("allows GET /invoices (read)", async () => {
      const res = await request(app).get("/api/v1/invoices");
      // Not 403 — may be 200 or another app-level error, but permission passed
      expect(res.status).not.toBe(403);
    });

    it("returns 403 on DELETE /invoices/:id (delete not in permissions)", async () => {
      const fakeId = new ObjectId().toString();
      const res = await request(app).delete(`/api/v1/invoices/${fakeId}`);
      expect(res.status).toBe(403);
    });

    it("returns 403 on GET /journal-entries (no access at all)", async () => {
      const res = await request(app).get("/api/v1/journal-entries");
      expect(res.status).toBe(403);
    });

    it("returns 403 on POST /journal-entries", async () => {
      const res = await request(app).post("/api/v1/journal-entries").send({});
      expect(res.status).toBe(403);
    });

    it("allows GET /api/v1/customers (read)", async () => {
      const res = await request(app).get("/api/v1/customers");
      expect(res.status).not.toBe(403);
    });
  });

  // ── Viewer-like permissions (read-only) ───────────────────────────────────

  describe("Viewer-like permissions (read-only on invoices)", () => {
    beforeAll(async () => {
      const db = mongoClient.db();
      await seedMemberWithPermissions(db, [
        { resource: "invoice", actions: ["read"] },
        { resource: "customer", actions: ["read"] },
      ]);
    });

    it("allows GET /invoices", async () => {
      const res = await request(app).get("/api/v1/invoices");
      expect(res.status).not.toBe(403);
    });

    it("returns 403 on POST /invoices (no create permission)", async () => {
      const res = await request(app).post("/api/v1/invoices").send({});
      expect(res.status).toBe(403);
    });

    it("returns 403 on DELETE /invoices/:id", async () => {
      const fakeId = new ObjectId().toString();
      const res = await request(app).delete(`/api/v1/invoices/${fakeId}`);
      expect(res.status).toBe(403);
    });

    it("returns 403 on GET /company-settings (no companySetting in permissions)", async () => {
      const res = await request(app).get("/api/v1/company-settings");
      expect(res.status).toBe(403);
    });
  });

  // ── Per-user grant override ───────────────────────────────────────────────

  describe("Per-user grant override", () => {
    beforeAll(async () => {
      const db = mongoClient.db();
      // Staff base: no journalEntry, but grant read via override
      await seedMemberWithPermissions(
        db,
        [{ resource: "journalEntry", actions: [] }],
        [{ resource: "journalEntry", actions: ["read"] }], // grant
      );
    });

    it("allows GET /journal-entries when granted via override", async () => {
      const res = await request(app).get("/api/v1/journal-entries");
      expect(res.status).not.toBe(403);
    });

    it("still blocks POST /journal-entries (only read was granted)", async () => {
      const res = await request(app).post("/api/v1/journal-entries").send({});
      expect(res.status).toBe(403);
    });
  });

  // ── Per-user revocation override ─────────────────────────────────────────

  describe("Per-user revocation override", () => {
    beforeAll(async () => {
      const db = mongoClient.db();
      // Accountant base: full CRUD on invoices; revoke delete via override
      await seedMemberWithPermissions(
        db,
        [
          {
            resource: "invoice",
            actions: ["read", "create", "update", "delete"],
          },
        ],
        [], // no extra grants
        [{ resource: "invoice", actions: ["delete"] }], // revoke delete
      );
    });

    it("allows GET /invoices (read not revoked)", async () => {
      const res = await request(app).get("/api/v1/invoices");
      expect(res.status).not.toBe(403);
    });

    it("blocks DELETE /invoices/:id (delete was revoked)", async () => {
      const fakeId = new ObjectId().toString();
      const res = await request(app).delete(`/api/v1/invoices/${fakeId}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Global admin bypass ───────────────────────────────────────────────────

  describe("Global admin bypass", () => {
    it("allows all requests regardless of MemberPermission record when user is admin", async () => {
      // Override to admin session
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
        user: {
          id: testUserId.toString(),
          email: "test-guard@example.com",
          role: "admin", // global admin — bypasses org permission check
        },
        session: { activeOrganizationId: testCompanyId.toString() },
      });

      // Member has no MemberPermission record (cleared by prior tests that used specific roles)
      // but admin bypasses the check entirely
      const res = await request(app).get("/api/v1/journal-entries");
      expect(res.status).not.toBe(403);

      // Restore non-admin session
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
        user: {
          id: testUserId.toString(),
          email: "test-guard@example.com",
          role: "user",
        },
        session: { activeOrganizationId: testCompanyId.toString() },
      });
    });
  });
});
