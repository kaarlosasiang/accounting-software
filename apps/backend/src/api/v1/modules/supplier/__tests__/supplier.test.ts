import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Supplier Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let createdSupplierId: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Create test company (organization)
    const companyResult = await db.collection("organization").insertOne({
      name: "Supplier Test Company",
      slug: `supp-test-${Date.now()}`,
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("user").insertOne({
      name: "Test User Suppliers",
      email: `test-suppliers-${Date.now()}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Create membership
    await db.collection("member").insertOne({
      userId: testUserId.toString(),
      organizationId: testCompanyId.toString(),
      role: "admin",
      createdAt: new Date(),
    });

    // Mock auth
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-suppliers@example.com",
        name: "Test User Suppliers",
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
    await db.collection("suppliers").deleteMany({ companyId: testCompanyId });
    await db.collection("organization").deleteOne({ _id: testCompanyId });
    await db.collection("user").deleteOne({ _id: testUserId });
    await db.collection("member").deleteMany({
      organizationId: testCompanyId.toString(),
    });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // CREATE — POST /api/v1/suppliers
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/suppliers", () => {
    it("should create a new supplier", async () => {
      const response = await request(app)
        .post("/api/v1/suppliers")
        .send({
          supplierCode: "SUP-001",
          supplierName: "Global Parts Inc",
          email: "parts@globalparts.com",
          phone: "555-1001",
          address: {
            street: "100 Industrial Way",
            city: "Detroit",
            state: "MI",
            zipCode: "48201",
            country: "USA",
          },
          taxId: "STAX-001",
          paymentTerms: "Net 30",
          openingBalance: 5000,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.supplierCode).toBe("SUP-001");
      expect(response.body.data.supplierName).toBe("Global Parts Inc");
      expect(response.body.data.email).toBe("parts@globalparts.com");
      expect(response.body.data.currentBalance).toBe(5000);
      createdSupplierId = response.body.data._id;
    });

    it("should auto-generate supplier code when not provided", async () => {
      const response = await request(app)
        .post("/api/v1/suppliers")
        .send({
          supplierName: "Auto Code Supplier",
          email: "autocode@supplier.com",
          phone: "555-1010",
          address: {
            street: "110 Auto Code St",
            city: "Cebu City",
            state: "Cebu",
            zipCode: "6000",
            country: "PH",
          },
          taxId: "STAX-AUTO",
          paymentTerms: "Net 30",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.supplierCode).toMatch(/^SUP-\d{3}$/);
    });

    it("should auto-populate displayName from supplierName", async () => {
      const response = await request(app)
        .post("/api/v1/suppliers")
        .send({
          supplierCode: "SUP-003",
          supplierName: "Raw Materials Co",
          email: "info@rawmaterials.com",
          phone: "555-1002",
          address: {
            street: "200 Supply Rd",
            city: "Chicago",
            state: "IL",
            zipCode: "60601",
            country: "USA",
          },
          taxId: "STAX-002",
          paymentTerms: "Net 15",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.displayName).toBe("Raw Materials Co");
    });

    it("should reject duplicate supplier code", async () => {
      const response = await request(app)
        .post("/api/v1/suppliers")
        .send({
          supplierCode: "SUP-001",
          supplierName: "Duplicate Code Supplier",
          email: "dup@supplier.com",
          phone: "555-1003",
          address: {
            street: "300 Dup St",
            city: "X",
            state: "X",
            zipCode: "00000",
            country: "USA",
          },
          taxId: "STAX-003",
          paymentTerms: "COD",
        });

      expect(response.status).toBe(409);
    });

    it("should reject duplicate email", async () => {
      const response = await request(app)
        .post("/api/v1/suppliers")
        .send({
          supplierCode: "SUP-DUPEMAIL",
          supplierName: "Dup Email Supplier",
          email: "parts@globalparts.com",
          phone: "555-1004",
          address: {
            street: "400 Dup Email",
            city: "X",
            state: "X",
            zipCode: "00000",
            country: "USA",
          },
          taxId: "STAX-DUPEMAIL",
          paymentTerms: "COD",
        });

      expect(response.status).toBe(409);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/suppliers")
        .send({
          supplierCode: "SUP-X",
          supplierName: "No Auth",
          email: "noauth@supplier.com",
          phone: "555-0000",
          address: {
            street: "1 Nope",
            city: "X",
            state: "X",
            zipCode: "00000",
            country: "X",
          },
          taxId: "X",
          paymentTerms: "COD",
        });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // LIST — GET /api/v1/suppliers
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/suppliers", () => {
    it("should list all suppliers", async () => {
      const response = await request(app).get("/api/v1/suppliers");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ACTIVE — GET /api/v1/suppliers/active
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/suppliers/active", () => {
    it("should list only active suppliers", async () => {
      const response = await request(app).get("/api/v1/suppliers/active");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      for (const s of response.body.data) {
        expect(s.isActive).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH — GET /api/v1/suppliers/search?q=
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/suppliers/search", () => {
    it("should find supplier by name", async () => {
      const response = await request(app)
        .get("/api/v1/suppliers/search")
        .query({ q: "Global" });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.data.some(
          (s: any) => s.supplierName === "Global Parts Inc",
        ),
      ).toBe(true);
    });

    it("should find supplier by code", async () => {
      const response = await request(app)
        .get("/api/v1/suppliers/search")
        .query({ q: "SUP-001" });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty array for no match", async () => {
      const response = await request(app)
        .get("/api/v1/suppliers/search")
        .query({ q: "ZZZZNOTEXIST" });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY CODE — GET /api/v1/suppliers/code/:code
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/suppliers/code/:code", () => {
    it("should get supplier by code", async () => {
      const response = await request(app).get("/api/v1/suppliers/code/SUP-001");
      expect(response.status).toBe(200);
      expect(response.body.data.supplierCode).toBe("SUP-001");
    });

    it("should return 404 for non-existent code", async () => {
      const response = await request(app).get(
        "/api/v1/suppliers/code/NONEXISTENT",
      );
      expect(response.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY ID — GET /api/v1/suppliers/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/suppliers/:id", () => {
    it("should get supplier by ID", async () => {
      const response = await request(app).get(
        `/api/v1/suppliers/${createdSupplierId}`,
      );
      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(createdSupplierId);
      expect(response.body.data.supplierName).toBe("Global Parts Inc");
    });

    it("should return 404 for non-existent ID", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(`/api/v1/suppliers/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE — PUT /api/v1/suppliers/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("PUT /api/v1/suppliers/:id", () => {
    it("should update a supplier", async () => {
      const response = await request(app)
        .put(`/api/v1/suppliers/${createdSupplierId}`)
        .send({
          phone: "555-8888",
          notes: "Updated via test",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe("555-8888");
      expect(response.body.data.notes).toBe("Updated via test");
    });

    it("should reject unauthenticated update", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/v1/suppliers/${createdSupplierId}`)
        .send({ notes: "Should fail" });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE (soft) — DELETE /api/v1/suppliers/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("DELETE /api/v1/suppliers/:id", () => {
    it("should soft-delete a supplier (deactivate)", async () => {
      // Create a disposable supplier to deactivate
      const createRes = await request(app)
        .post("/api/v1/suppliers")
        .send({
          supplierCode: "SUP-DEL",
          supplierName: "To Be Deactivated",
          email: "deactivate@supplier.com",
          phone: "555-0DEL",
          address: {
            street: "1 Deactivate Ln",
            city: "Gone",
            state: "CA",
            zipCode: "90000",
            country: "USA",
          },
          taxId: "STAX-DEL",
          paymentTerms: "COD",
        });

      expect(createRes.status).toBe(201);
      const delId = createRes.body.data._id;

      const response = await request(app).delete(`/api/v1/suppliers/${delId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify supplier is deactivated but still exists
      const getRes = await request(app).get(`/api/v1/suppliers/${delId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.isActive).toBe(false);
    });

    it("should reject unauthenticated delete", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).delete(
        `/api/v1/suppliers/${createdSupplierId}`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should return 404 for non-existent supplier", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).delete(`/api/v1/suppliers/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });
});
