import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Bill Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let testSupplierId: ObjectId;
  let expenseAccountId: ObjectId;
  let bankAccountId: ObjectId;
  let apAccountId: ObjectId;
  let createdBillId: string;
  let createdBillNumber: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale data from previous runs
    await db
      .collection("users")
      .deleteMany({ email: "test-bills@example.com" });
    const oldCompanies = await db
      .collection("organizations")
      .find({ slug: "test-company-bills" })
      .toArray();
    for (const oc of oldCompanies) {
      await db.collection("bills").deleteMany({ companyId: oc._id });
      await db.collection("payments").deleteMany({ companyId: oc._id });
      await db.collection("journalEntries").deleteMany({ companyId: oc._id });
      await db.collection("ledgers").deleteMany({ companyId: oc._id });
      await db.collection("accounts").deleteMany({ companyId: oc._id });
      await db.collection("suppliers").deleteMany({ companyId: oc._id });
    }
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-bills" });

    // Clean up orphaned records (from any previous failed test runs)
    const existingOrgIds = (
      await db
        .collection("organizations")
        .find({})
        .project({ _id: 1 })
        .toArray()
    ).map((o) => o._id);
    await db.collection("bills").deleteMany({
      companyId: { $nin: existingOrgIds },
    });
    await db.collection("journalEntries").deleteMany({
      companyId: { $nin: existingOrgIds },
    });
    await db.collection("payments").deleteMany({
      companyId: { $nin: existingOrgIds },
    });

    // Create company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Bill Tests",
      slug: "test-company-bills",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create user
    const userResult = await db.collection("users").insertOne({
      name: "Test User Bills",
      email: "test-bills@example.com",
      username: `test-user-bills-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Create supplier
    const supplierResult = await db.collection("suppliers").insertOne({
      companyId: testCompanyId,
      supplierCode: `SUP-BILL-${Date.now()}`,
      supplierName: "Bill Test Supplier",
      displayName: "Bill Test Supplier",
      email: "bill-supplier@example.com",
      phone: "555-0202",
      address: {
        street: "200 Supplier St",
        city: "Supplyville",
        state: "SP",
        zipCode: "54321",
        country: "US",
      },
      taxId: "TAX-BILL-001",
      paymentTerms: "Net 30",
      currentBalance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testSupplierId = supplierResult.insertedId;

    // Create expense account
    const expenseResult = await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "5100",
      accountName: "Office Supplies Expense",
      accountType: "Expense",
      normalBalance: "Debit",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expenseAccountId = expenseResult.insertedId;

    // Create bank account
    const bankResult = await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "1020",
      accountName: "Business Bank Account",
      accountType: "Asset",
      normalBalance: "Debit",
      balance: 50000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    bankAccountId = bankResult.insertedId;

    // Create AP account (needed by JournalEntryService)
    const apResult = await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "2100",
      accountName: "Accounts Payable",
      accountType: "Liability",
      subType: "Accounts Payable",
      normalBalance: "Credit",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    apAccountId = apResult.insertedId;

    // Create General Expenses account (needed by JournalEntryService.createBillJournalEntry as fallback)
    await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "5000",
      accountName: "General Expenses",
      accountType: "Expense",
      normalBalance: "Debit",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock auth
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-bills@example.com",
        name: "Test User Bills",
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
    await db.collection("bills").deleteMany({ companyId: testCompanyId });
    await db.collection("payments").deleteMany({ companyId: testCompanyId });
    await db
      .collection("journalEntries")
      .deleteMany({ companyId: testCompanyId });
    await db.collection("ledgers").deleteMany({ companyId: testCompanyId });
    await db.collection("accounts").deleteMany({ companyId: testCompanyId });
    await db.collection("suppliers").deleteMany({ companyId: testCompanyId });
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({ _id: testUserId });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // CREATE BILL — POST /api/v1/bills
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/bills", () => {
    it("should create a draft bill", async () => {
      const response = await request(app)
        .post("/api/v1/bills")
        .send({
          supplierId: testSupplierId.toString(),
          billDate: "2026-01-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Office Supplies",
              quantity: 20,
              unitPrice: 50,
              accountId: expenseAccountId.toString(),
              amount: 1000,
            },
          ],
          subtotal: 1000,
          taxRate: 0,
          taxAmount: 0,
          discount: 0,
          totalAmount: 1000,
          balanceDue: 1000,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Bill created successfully");
      expect(response.body.data.status).toBe("Draft");
      expect(response.body.data.billNumber).toMatch(/^BILL-\d{4}-\d+$/);
      expect(response.body.data.totalAmount).toBe(1000);
      expect(response.body.data.balanceDue).toBe(1000);
      expect(response.body.data.amountPaid).toBe(0);

      createdBillId = response.body.data._id;
      createdBillNumber = response.body.data.billNumber;
    });

    it("should create a bill with multiple line items", async () => {
      const response = await request(app)
        .post("/api/v1/bills")
        .send({
          supplierId: testSupplierId.toString(),
          billDate: "2026-02-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Printer Paper",
              quantity: 10,
              unitPrice: 30,
              accountId: expenseAccountId.toString(),
              amount: 300,
            },
            {
              description: "Ink Cartridges",
              quantity: 5,
              unitPrice: 80,
              accountId: expenseAccountId.toString(),
              amount: 400,
            },
          ],
          subtotal: 700,
          taxRate: 0,
          taxAmount: 0,
          discount: 0,
          totalAmount: 700,
          balanceDue: 700,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.totalAmount).toBe(700);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/bills")
        .send({
          supplierId: testSupplierId.toString(),
          billDate: "2026-03-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Test",
              quantity: 1,
              unitPrice: 100,
              accountId: expenseAccountId.toString(),
              amount: 100,
            },
          ],
          subtotal: 100,
          taxRate: 0,
          taxAmount: 0,
          discount: 0,
          totalAmount: 100,
          balanceDue: 100,
        });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should reject bill with non-existent supplier", async () => {
      const fakeSupplierId = new ObjectId().toString();
      const response = await request(app)
        .post("/api/v1/bills")
        .send({
          supplierId: fakeSupplierId,
          billDate: "2026-04-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Test",
              quantity: 1,
              unitPrice: 100,
              accountId: expenseAccountId.toString(),
              amount: 100,
            },
          ],
          subtotal: 100,
          taxRate: 0,
          taxAmount: 0,
          discount: 0,
          totalAmount: 100,
          balanceDue: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ALL BILLS — GET /api/v1/bills
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/bills", () => {
    it("should list all bills", async () => {
      const response = await request(app).get("/api/v1/bills");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/bills");
      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BILL BY ID — GET /api/v1/bills/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/bills/:id", () => {
    it("should return a specific bill", async () => {
      const response = await request(app).get(`/api/v1/bills/${createdBillId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(createdBillId);
      expect(response.body.data.billNumber).toBe(createdBillNumber);
    });

    it("should return 404 for non-existent bill", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(`/api/v1/bills/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY STATUS — GET /api/v1/bills/status/:status
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/bills/status/:status", () => {
    it("should return draft bills", async () => {
      const response = await request(app).get("/api/v1/bills/status/Draft");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((bill: any) => {
        expect(bill.status).toBe("Draft");
      });
    });

    it("should return empty for void status", async () => {
      const response = await request(app).get("/api/v1/bills/status/Void");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY SUPPLIER — GET /api/v1/bills/supplier/:supplierId
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/bills/supplier/:supplierId", () => {
    it("should return bills for a specific supplier", async () => {
      const response = await request(app).get(
        `/api/v1/bills/supplier/${testSupplierId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty for supplier with no bills", async () => {
      const fakeSupplierId = new ObjectId().toString();
      const response = await request(app).get(
        `/api/v1/bills/supplier/${fakeSupplierId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH BILLS — GET /api/v1/bills/search
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/bills/search", () => {
    it("should search bills by supplier name", async () => {
      const response = await request(app)
        .get("/api/v1/bills/search")
        .query({ q: "Bill Test" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should require search term", async () => {
      const response = await request(app).get("/api/v1/bills/search");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // OVERDUE BILLS — GET /api/v1/bills/overdue
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/bills/overdue", () => {
    it("should return overdue bills (none expected yet)", async () => {
      const response = await request(app).get("/api/v1/bills/overdue");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE BILL — PUT /api/v1/bills/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("PUT /api/v1/bills/:id", () => {
    it("should update a draft bill", async () => {
      const response = await request(app)
        .put(`/api/v1/bills/${createdBillId}`)
        .send({
          notes: "Updated via test",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Bill updated successfully");
      expect(response.body.data.notes).toBe("Updated via test");
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/v1/bills/${createdBillId}`)
        .send({ notes: "Should fail" });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // APPROVE BILL — POST /api/v1/bills/:id/approve
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/bills/:id/approve", () => {
    it("should approve bill (transition from Draft to Sent)", async () => {
      const response = await request(app).post(
        `/api/v1/bills/${createdBillId}/approve`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Bill approved successfully");
      expect(response.body.data.status).toBe("Sent");
      // Journal entry created on status transition
      expect(response.body.data.journalEntryId).toBeTruthy();
    });

    it("should not change already approved bill status", async () => {
      const response = await request(app).post(
        `/api/v1/bills/${createdBillId}/approve`,
      );

      // Already Sent → stays Sent, still returns 200
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("Sent");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // RECORD PAYMENT — POST /api/v1/bills/:id/payments
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/bills/:id/payments", () => {
    it("should record a partial payment", async () => {
      const response = await request(app)
        .post(`/api/v1/bills/${createdBillId}/payments`)
        .send({
          supplierId: testSupplierId.toString(),
          amount: 500,
          paymentDate: new Date().toISOString(),
          paymentMethod: "Bank Transfer",
          referenceNumber: "PAY-BILL-001",
          bankAccountId: bankAccountId.toString(),
          allocations: [
            {
              documentId: createdBillId,
              documentNumber: createdBillNumber,
              allocatedAmount: 500,
              documentType: "BILL",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Payment recorded successfully");
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.billsUpdated).toBeDefined();

      // Check bill status updated to Partial
      const billRes = await request(app).get(`/api/v1/bills/${createdBillId}`);
      expect(billRes.body.data.amountPaid).toBe(500);
      expect(billRes.body.data.status).toBe("Partial");
    });

    it("should record remaining payment to fully pay bill", async () => {
      const billRes = await request(app).get(`/api/v1/bills/${createdBillId}`);
      const remaining = billRes.body.data.balanceDue;

      const response = await request(app)
        .post(`/api/v1/bills/${createdBillId}/payments`)
        .send({
          supplierId: testSupplierId.toString(),
          amount: remaining,
          paymentDate: new Date().toISOString(),
          paymentMethod: "Bank Transfer",
          referenceNumber: "PAY-BILL-002",
          bankAccountId: bankAccountId.toString(),
          allocations: [
            {
              documentId: createdBillId,
              documentNumber: createdBillNumber,
              allocatedAmount: remaining,
              documentType: "BILL",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Check bill is now Paid
      const paidRes = await request(app).get(`/api/v1/bills/${createdBillId}`);
      expect(paidRes.body.data.status).toBe("Paid");
      expect(paidRes.body.data.balanceDue).toBeLessThanOrEqual(0.01);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BILL PAYMENTS — GET /api/v1/bills/:id/payments
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/bills/:id/payments", () => {
    it("should return payments for the bill", async () => {
      const response = await request(app).get(
        `/api/v1/bills/${createdBillId}/payments`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VOID BILL — POST /api/v1/bills/:id/void
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/bills/:id/void", () => {
    it("should not void a paid bill", async () => {
      const response = await request(app).post(
        `/api/v1/bills/${createdBillId}/void`,
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should void an approved bill with no payments", async () => {
      // Create and approve a separate bill to void
      const createRes = await request(app)
        .post("/api/v1/bills")
        .send({
          supplierId: testSupplierId.toString(),
          billDate: "2026-05-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Voidable Supply",
              quantity: 1,
              unitPrice: 200,
              accountId: expenseAccountId.toString(),
              amount: 200,
            },
          ],
          subtotal: 200,
          taxRate: 0,
          taxAmount: 0,
          discount: 0,
          totalAmount: 200,
          balanceDue: 200,
        });
      const voidableId = createRes.body.data._id;

      // Approve it first
      await request(app).post(`/api/v1/bills/${voidableId}/approve`);

      // Now void it
      const response = await request(app).post(
        `/api/v1/bills/${voidableId}/void`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Bill voided successfully");
      expect(response.body.data.status).toBe("Void");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE BILL — DELETE /api/v1/bills/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("DELETE /api/v1/bills/:id", () => {
    it("should not delete a non-draft bill", async () => {
      // The created bill is now Paid → cannot delete
      const response = await request(app).delete(
        `/api/v1/bills/${createdBillId}`,
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should delete a draft bill", async () => {
      // Create a fresh draft bill
      const createRes = await request(app)
        .post("/api/v1/bills")
        .send({
          supplierId: testSupplierId.toString(),
          billDate: "2026-06-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Deletable Supply",
              quantity: 1,
              unitPrice: 50,
              accountId: expenseAccountId.toString(),
              amount: 50,
            },
          ],
          subtotal: 50,
          taxRate: 0,
          taxAmount: 0,
          discount: 0,
          totalAmount: 50,
          balanceDue: 50,
        });
      const deletableId = createRes.body.data._id;

      const response = await request(app).delete(
        `/api/v1/bills/${deletableId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Bill deleted successfully");
    });

    it("should reject unauthenticated delete", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).delete(
        `/api/v1/bills/${createdBillId}`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Business rule: Cannot update paid/void bills
  // ═══════════════════════════════════════════════════════════════════
  describe("Business rule: Cannot update paid/void bills", () => {
    it("should not update a paid bill", async () => {
      const response = await request(app)
        .put(`/api/v1/bills/${createdBillId}`)
        .send({ notes: "Should not work" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
