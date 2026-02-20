import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Customer Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let createdCustomerId: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Create test company (organization)
    const companyResult = await db.collection("organization").insertOne({
      name: "Customer Test Company",
      slug: `cust-test-${Date.now()}`,
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("user").insertOne({
      name: "Test User Customers",
      email: `test-customers-${Date.now()}@example.com`,
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
        email: "test-customers@example.com",
        name: "Test User Customers",
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
    await db.collection("customers").deleteMany({ companyId: testCompanyId });
    await db.collection("organization").deleteOne({ _id: testCompanyId });
    await db.collection("user").deleteOne({ _id: testUserId });
    await db.collection("member").deleteMany({
      organizationId: testCompanyId.toString(),
    });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // CREATE — POST /api/v1/customers
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/customers", () => {
    it("should create a new customer", async () => {
      const response = await request(app)
        .post("/api/v1/customers")
        .send({
          customerCode: "CUST-001",
          customerName: "Acme Corporation",
          email: "acme@example.com",
          phone: "555-0100",
          billingAddress: {
            street: "123 Main St",
            city: "Springfield",
            state: "IL",
            zipCode: "62701",
            country: "USA",
          },
          taxId: "TAX-001",
          paymentTerms: "Net 30",
          creditLimit: 50000,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerCode).toBe("CUST-001");
      expect(response.body.data.customerName).toBe("Acme Corporation");
      expect(response.body.data.email).toBe("acme@example.com");
      expect(response.body.data.creditLimit).toBe(50000);
      createdCustomerId = response.body.data._id;
    });

    it("should auto-generate displayName from customerName", async () => {
      const response = await request(app)
        .post("/api/v1/customers")
        .send({
          customerCode: "CUST-002",
          customerName: "Beta Industries",
          email: "beta@example.com",
          phone: "555-0200",
          billingAddress: {
            street: "456 Oak St",
            city: "Shelbyville",
            state: "IL",
            zipCode: "62702",
            country: "USA",
          },
          taxId: "TAX-002",
          paymentTerms: "Net 15",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.displayName).toBe("Beta Industries");
    });

    it("should reject duplicate customer code", async () => {
      const response = await request(app)
        .post("/api/v1/customers")
        .send({
          customerCode: "CUST-001",
          customerName: "Duplicate Code Co",
          email: "dupcode@example.com",
          phone: "555-0300",
          billingAddress: {
            street: "789 Elm St",
            city: "Capital City",
            state: "IL",
            zipCode: "62703",
            country: "USA",
          },
          taxId: "TAX-003",
          paymentTerms: "Net 30",
        });

      expect(response.status).toBe(409);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/customers")
        .send({
          customerCode: "CUST-X",
          customerName: "No Auth",
          email: "noauth@example.com",
          phone: "555-0000",
          billingAddress: {
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
  // LIST — GET /api/v1/customers
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/customers", () => {
    it("should list all customers", async () => {
      const response = await request(app).get("/api/v1/customers");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ACTIVE — GET /api/v1/customers/active
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/customers/active", () => {
    it("should list only active customers", async () => {
      const response = await request(app).get("/api/v1/customers/active");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // All returned customers should be active
      for (const c of response.body.data) {
        expect(c.isActive).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH — GET /api/v1/customers/search?q=
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/customers/search", () => {
    it("should find customer by name", async () => {
      const response = await request(app)
        .get("/api/v1/customers/search")
        .query({ q: "Acme" });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.data.some(
          (c: any) => c.customerName === "Acme Corporation",
        ),
      ).toBe(true);
    });

    it("should find customer by code", async () => {
      const response = await request(app)
        .get("/api/v1/customers/search")
        .query({ q: "CUST-001" });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty array for no match", async () => {
      const response = await request(app)
        .get("/api/v1/customers/search")
        .query({ q: "ZZZZNOTEXIST" });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY CODE — GET /api/v1/customers/code/:code
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/customers/code/:code", () => {
    it("should get customer by code", async () => {
      const response = await request(app).get(
        "/api/v1/customers/code/CUST-001",
      );
      expect(response.status).toBe(200);
      expect(response.body.data.customerCode).toBe("CUST-001");
    });

    it("should return 404 for non-existent code", async () => {
      const response = await request(app).get(
        "/api/v1/customers/code/NONEXISTENT",
      );
      expect(response.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY ID — GET /api/v1/customers/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/customers/:id", () => {
    it("should get customer by ID", async () => {
      const response = await request(app).get(
        `/api/v1/customers/${createdCustomerId}`,
      );
      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(createdCustomerId);
      expect(response.body.data.customerName).toBe("Acme Corporation");
    });

    it("should return 404 for non-existent ID", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(`/api/v1/customers/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE — PUT /api/v1/customers/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("PUT /api/v1/customers/:id", () => {
    it("should update a customer", async () => {
      const response = await request(app)
        .put(`/api/v1/customers/${createdCustomerId}`)
        .send({
          phone: "555-9999",
          notes: "Updated via test",
          creditLimit: 75000,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe("555-9999");
      expect(response.body.data.creditLimit).toBe(75000);
      expect(response.body.data.notes).toBe("Updated via test");
    });

    it("should reject unauthenticated update", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/v1/customers/${createdCustomerId}`)
        .send({ notes: "Should fail" });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // TOGGLE STATUS — PATCH /api/v1/customers/:id/toggle-status
  // ═══════════════════════════════════════════════════════════════════
  describe("PATCH /api/v1/customers/:id/toggle-status", () => {
    it("should deactivate an active customer", async () => {
      const response = await request(app).patch(
        `/api/v1/customers/${createdCustomerId}/toggle-status`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it("should reactivate a deactivated customer", async () => {
      const response = await request(app).patch(
        `/api/v1/customers/${createdCustomerId}/toggle-status`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE BALANCE — PATCH /api/v1/customers/:id/balance
  // ═══════════════════════════════════════════════════════════════════
  describe("PATCH /api/v1/customers/:id/balance", () => {
    it("should update customer balance", async () => {
      const response = await request(app)
        .patch(`/api/v1/customers/${createdCustomerId}/balance`)
        .send({ amount: 1500 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentBalance).toBe(1500);
    });

    it("should handle negative balance adjustment", async () => {
      const response = await request(app)
        .patch(`/api/v1/customers/${createdCustomerId}/balance`)
        .send({ amount: -500 });

      expect(response.status).toBe(200);
      expect(response.body.data.currentBalance).toBe(1000);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // CHECK CREDIT — POST /api/v1/customers/:id/check-credit
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/customers/:id/check-credit", () => {
    it("should confirm credit is available", async () => {
      // creditLimit=75000, currentBalance=1000 → available=74000
      const response = await request(app)
        .post(`/api/v1/customers/${createdCustomerId}/check-credit`)
        .send({ amount: 5000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasCredit).toBe(true);
      expect(response.body.data.creditLimit).toBe(75000);
      expect(response.body.data.currentBalance).toBe(1000);
      expect(response.body.data.availableCredit).toBe(74000);
    });

    it("should deny credit when limit exceeded", async () => {
      const response = await request(app)
        .post(`/api/v1/customers/${createdCustomerId}/check-credit`)
        .send({ amount: 80000 });

      expect(response.status).toBe(200);
      expect(response.body.data.hasCredit).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE — DELETE /api/v1/customers/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("DELETE /api/v1/customers/:id", () => {
    it("should reject unauthenticated delete", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).delete(
        `/api/v1/customers/${createdCustomerId}`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should delete a customer (hard delete)", async () => {
      // Create a disposable customer to delete
      const createRes = await request(app)
        .post("/api/v1/customers")
        .send({
          customerCode: "CUST-DEL",
          customerName: "To Be Deleted",
          email: "delete-me@example.com",
          phone: "555-0DEL",
          billingAddress: {
            street: "1 Delete Ln",
            city: "Gone",
            state: "CA",
            zipCode: "90000",
            country: "USA",
          },
          taxId: "TAX-DEL",
          paymentTerms: "COD",
        });

      expect(createRes.status).toBe(201);
      const delId = createRes.body.data._id;

      const response = await request(app).delete(`/api/v1/customers/${delId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify it's gone
      const getRes = await request(app).get(`/api/v1/customers/${delId}`);
      expect(getRes.status).toBe(404);
    });

    it("should return 404 for non-existent customer", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).delete(`/api/v1/customers/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });
});
