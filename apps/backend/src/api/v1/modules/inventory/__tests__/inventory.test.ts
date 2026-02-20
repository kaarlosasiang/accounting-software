import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Inventory Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let testSupplierId: ObjectId;
  let inventoryAccountId: ObjectId;
  let cogsAccountId: ObjectId;
  let incomeAccountId: ObjectId;
  let createdItemId: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Create test company (organization)
    const companyResult = await db.collection("organization").insertOne({
      name: "Inventory Test Company",
      slug: `inv-test-${Date.now()}`,
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("user").insertOne({
      name: "Test User Inventory",
      email: `test-inventory-${Date.now()}@example.com`,
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

    // Create supplier for inventory items
    const supplierResult = await db.collection("suppliers").insertOne({
      companyId: testCompanyId,
      supplierCode: "SUP-INV-001",
      supplierName: "Inventory Supplier",
      displayName: "Inventory Supplier",
      email: "inv-supplier@example.com",
      phone: "555-7001",
      address: {
        street: "100 Supply Dr",
        city: "Austin",
        state: "TX",
        zipCode: "73301",
        country: "USA",
      },
      taxId: "INV-STAX",
      paymentTerms: "Net 30",
      currentBalance: 0,
      openingBalance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testSupplierId = supplierResult.insertedId;

    // Create accounts needed for inventory items
    const invAccResult = await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "1300",
      accountName: "Inventory Asset",
      accountType: "Asset",
      normalBalance: "Debit",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    inventoryAccountId = invAccResult.insertedId;

    const cogsResult = await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "5100",
      accountName: "Cost of Goods Sold",
      accountType: "Expense",
      normalBalance: "Debit",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    cogsAccountId = cogsResult.insertedId;

    const incomeResult = await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "4100",
      accountName: "Sales Revenue",
      accountType: "Revenue",
      normalBalance: "Credit",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    incomeAccountId = incomeResult.insertedId;

    // Mock auth
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-inventory@example.com",
        name: "Test User Inventory",
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
      .collection("inventoryitems")
      .deleteMany({ companyId: testCompanyId });
    await db
      .collection("inventorytransactions")
      .deleteMany({ companyId: testCompanyId });
    await db.collection("accounts").deleteMany({ companyId: testCompanyId });
    await db.collection("suppliers").deleteMany({ companyId: testCompanyId });
    await db.collection("organization").deleteOne({ _id: testCompanyId });
    await db.collection("user").deleteOne({ _id: testUserId });
    await db.collection("member").deleteMany({
      organizationId: testCompanyId.toString(),
    });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // CREATE — POST /api/v1/inventory
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/inventory", () => {
    it("should create a new inventory item", async () => {
      const response = await request(app).post("/api/v1/inventory").send({
        sku: "ITEM-001",
        itemName: "Widget A",
        category: "Non-Food",
        unit: "pcs",
        quantityOnHand: 100,
        unitCost: 25,
        sellingPrice: 45,
        reorderLevel: 10,
        inventoryAccountId: inventoryAccountId.toString(),
        cogsAccountId: cogsAccountId.toString(),
        incomeAccountId: incomeAccountId.toString(),
        supplierId: testSupplierId.toString(),
        salesTaxEnabled: false,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBe("ITEM-001");
      expect(response.body.data.itemName).toBe("Widget A");
      expect(response.body.data.quantityOnHand).toBe(100);
      expect(response.body.data.unitCost).toBe(25);
      expect(response.body.data.sellingPrice).toBe(45);
      createdItemId = response.body.data._id;
    });

    it("should create a second food category item", async () => {
      const response = await request(app).post("/api/v1/inventory").send({
        sku: "FOOD-001",
        itemName: "Organic Rice",
        category: "Food",
        unit: "kg",
        quantityOnHand: 500,
        unitCost: 3,
        sellingPrice: 5,
        reorderLevel: 50,
        inventoryAccountId: inventoryAccountId.toString(),
        cogsAccountId: cogsAccountId.toString(),
        incomeAccountId: incomeAccountId.toString(),
        salesTaxEnabled: true,
        salesTaxRate: 5,
        purchaseTaxRate: 5,
      });

      expect(response.status).toBe(201);
      expect(response.body.data.category).toBe("Food");
      expect(response.body.data.salesTaxEnabled).toBe(true);
      expect(response.body.data.salesTaxRate).toBe(5);
    });

    it("should reject duplicate SKU", async () => {
      const response = await request(app).post("/api/v1/inventory").send({
        sku: "ITEM-001",
        itemName: "Duplicate SKU",
        category: "Non-Food",
        unit: "pcs",
        unitCost: 10,
        sellingPrice: 20,
        inventoryAccountId: inventoryAccountId.toString(),
        cogsAccountId: cogsAccountId.toString(),
        incomeAccountId: incomeAccountId.toString(),
        salesTaxEnabled: false,
      });

      expect(response.status).toBe(409);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).post("/api/v1/inventory").send({
        sku: "ITEM-X",
        itemName: "No Auth",
        category: "Non-Food",
        unit: "pcs",
        unitCost: 1,
        sellingPrice: 2,
        inventoryAccountId: inventoryAccountId.toString(),
        cogsAccountId: cogsAccountId.toString(),
        incomeAccountId: incomeAccountId.toString(),
        salesTaxEnabled: false,
      });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // LIST / FILTER — GET endpoints
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/inventory", () => {
    it("should list all inventory items", async () => {
      const response = await request(app).get("/api/v1/inventory");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("GET /api/v1/inventory/active", () => {
    it("should list only active items", async () => {
      const response = await request(app).get("/api/v1/inventory/active");
      expect(response.status).toBe(200);
      for (const item of response.body.data) {
        expect(item.isActive).toBe(true);
      }
    });
  });

  describe("GET /api/v1/inventory/search", () => {
    it("should find item by name", async () => {
      const response = await request(app)
        .get("/api/v1/inventory/search")
        .query({ q: "Widget" });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.data.some((i: any) => i.itemName === "Widget A"),
      ).toBe(true);
    });

    it("should find item by SKU", async () => {
      const response = await request(app)
        .get("/api/v1/inventory/search")
        .query({ q: "ITEM-001" });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/v1/inventory/sku/:sku", () => {
    it("should get item by SKU", async () => {
      const response = await request(app).get("/api/v1/inventory/sku/ITEM-001");
      expect(response.status).toBe(200);
      expect(response.body.data.sku).toBe("ITEM-001");
    });

    it("should return 404 for non-existent SKU", async () => {
      const response = await request(app).get(
        "/api/v1/inventory/sku/NONEXISTENT",
      );
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/inventory/category/:category", () => {
    it("should get items by Food category", async () => {
      const response = await request(app).get(
        "/api/v1/inventory/category/Food",
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      for (const item of response.body.data) {
        expect(item.category).toBe("Food");
      }
    });

    it("should get items by Non-Food category", async () => {
      const response = await request(app).get(
        "/api/v1/inventory/category/Non-Food",
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY ID — GET /api/v1/inventory/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/inventory/:id", () => {
    it("should get item by ID", async () => {
      const response = await request(app).get(
        `/api/v1/inventory/${createdItemId}`,
      );
      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(createdItemId);
      expect(response.body.data.itemName).toBe("Widget A");
    });

    it("should return 404 for non-existent ID", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(`/api/v1/inventory/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE — PUT /api/v1/inventory/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("PUT /api/v1/inventory/:id", () => {
    it("should update an inventory item", async () => {
      const response = await request(app)
        .put(`/api/v1/inventory/${createdItemId}`)
        .send({
          sellingPrice: 50,
          reorderLevel: 20,
          description: "Updated widget description",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sellingPrice).toBe(50);
      expect(response.body.data.reorderLevel).toBe(20);
    });

    it("should reject unauthenticated update", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/v1/inventory/${createdItemId}`)
        .send({ sellingPrice: 60 });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADJUST QUANTITY — POST /api/v1/inventory/:id/adjust
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/inventory/:id/adjust", () => {
    it("should increase quantity", async () => {
      const response = await request(app)
        .post(`/api/v1/inventory/${createdItemId}/adjust`)
        .send({ adjustment: 50, reason: "Received shipment" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quantityOnHand).toBe(150); // 100 + 50
    });

    it("should decrease quantity", async () => {
      const response = await request(app)
        .post(`/api/v1/inventory/${createdItemId}/adjust`)
        .send({ adjustment: -30, reason: "Damaged goods" });

      expect(response.status).toBe(200);
      expect(response.body.data.quantityOnHand).toBe(120); // 150 - 30
    });

    it("should reject adjustment that would make quantity negative", async () => {
      const response = await request(app)
        .post(`/api/v1/inventory/${createdItemId}/adjust`)
        .send({ adjustment: -200, reason: "Too much" });

      expect(response.status).toBe(400);
    });

    it("should create an inventory transaction on adjustment", async () => {
      const response = await request(app).get(
        `/api/v1/inventory/${createdItemId}/transactions`,
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // REORDER — GET /api/v1/inventory/reorder/needed
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/inventory/reorder/needed", () => {
    it("should return items needing reorder", async () => {
      // Create an item with low stock
      await request(app).post("/api/v1/inventory").send({
        sku: "LOW-STOCK",
        itemName: "Low Stock Item",
        category: "Non-Food",
        unit: "pcs",
        quantityOnHand: 5,
        unitCost: 10,
        sellingPrice: 20,
        reorderLevel: 50,
        inventoryAccountId: inventoryAccountId.toString(),
        cogsAccountId: cogsAccountId.toString(),
        incomeAccountId: incomeAccountId.toString(),
        salesTaxEnabled: false,
      });

      const response = await request(app).get(
        "/api/v1/inventory/reorder/needed",
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.some((i: any) => i.sku === "LOW-STOCK")).toBe(
        true,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALUE — GET /api/v1/inventory/value/total
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/inventory/value/total", () => {
    it("should return total inventory value", async () => {
      const response = await request(app).get("/api/v1/inventory/value/total");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.totalValue).toBe("number");
      expect(response.body.data.totalValue).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALUATION REPORT — GET /api/v1/inventory/reports/valuation
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/inventory/reports/valuation", () => {
    it("should return inventory valuation report", async () => {
      const response = await request(app).get(
        "/api/v1/inventory/reports/valuation",
      );
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(typeof response.body.data.totals.totalInventoryValue).toBe(
        "number",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // TRANSACTIONS — GET /api/v1/inventory/transactions/all
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/inventory/transactions/all", () => {
    it("should return all inventory transactions", async () => {
      const response = await request(app).get(
        "/api/v1/inventory/transactions/all",
      );
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MOVEMENT SUMMARY — GET /api/v1/inventory/:id/movement-summary
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/inventory/:id/movement-summary", () => {
    it("should return movement summary for date range", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const response = await request(app)
        .get(`/api/v1/inventory/${createdItemId}/movement-summary`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // COGS — GET /api/v1/inventory/:id/cogs
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/inventory/:id/cogs", () => {
    it("should calculate COGS for date range", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const response = await request(app)
        .get(`/api/v1/inventory/${createdItemId}/cogs`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE (soft) — DELETE /api/v1/inventory/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("DELETE /api/v1/inventory/:id", () => {
    it("should soft-delete an inventory item", async () => {
      // Create a disposable item
      const createRes = await request(app).post("/api/v1/inventory").send({
        sku: "DEL-ITEM",
        itemName: "To Be Deactivated",
        category: "Non-Food",
        unit: "pcs",
        quantityOnHand: 10,
        unitCost: 5,
        sellingPrice: 10,
        reorderLevel: 0,
        inventoryAccountId: inventoryAccountId.toString(),
        cogsAccountId: cogsAccountId.toString(),
        incomeAccountId: incomeAccountId.toString(),
        salesTaxEnabled: false,
      });

      expect(createRes.status).toBe(201);
      const delId = createRes.body.data._id;

      const response = await request(app).delete(`/api/v1/inventory/${delId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify item is deactivated but still exists
      const getRes = await request(app).get(`/api/v1/inventory/${delId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.isActive).toBe(false);
    });

    it("should reject unauthenticated delete", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).delete(
        `/api/v1/inventory/${createdItemId}`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });
});
