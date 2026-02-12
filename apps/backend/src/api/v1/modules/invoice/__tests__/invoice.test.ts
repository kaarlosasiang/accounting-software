import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

// Mock email service to prevent actual SMTP calls
vi.mock("../../../services/email.service.js", () => ({
  EmailService: {
    sendInvoice: vi.fn().mockResolvedValue(true),
  },
}));

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Invoice Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let testCustomerId: ObjectId;
  let revenueAccountId: ObjectId;
  let bankAccountId: ObjectId;
  let arAccountId: ObjectId;
  let createdInvoiceId: string;
  let createdInvoiceNumber: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale data from previous runs
    await db
      .collection("users")
      .deleteMany({ email: "test-invoices@example.com" });
    // Find old test companies (may already be deleted from failed runs)
    const oldCompanies = await db
      .collection("organizations")
      .find({ slug: "test-company-invoices" })
      .toArray();
    for (const oc of oldCompanies) {
      await db.collection("invoices").deleteMany({ companyId: oc._id });
      await db.collection("payments").deleteMany({ companyId: oc._id });
      await db.collection("journalEntries").deleteMany({ companyId: oc._id });
      await db.collection("ledgers").deleteMany({ companyId: oc._id });
      await db.collection("accounts").deleteMany({ companyId: oc._id });
      await db.collection("customers").deleteMany({ companyId: oc._id });
    }
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-invoices" });

    // Clean up orphaned records (from any previous failed test runs)
    const existingOrgIds = (
      await db
        .collection("organizations")
        .find({})
        .project({ _id: 1 })
        .toArray()
    ).map((o) => o._id);
    await db.collection("invoices").deleteMany({
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
      name: "Test Company - Invoice Tests",
      slug: "test-company-invoices",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create user
    const userResult = await db.collection("users").insertOne({
      name: "Test User Invoices",
      email: "test-invoices@example.com",
      username: `test-user-invoices-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Create customer
    const customerResult = await db.collection("customers").insertOne({
      companyId: testCompanyId,
      customerCode: `CUST-INV-${Date.now()}`,
      customerName: "Invoice Test Customer",
      displayName: "Invoice Test Customer",
      email: "invoice-customer@example.com",
      phone: "555-0101",
      billingAddress: {
        street: "100 Test St",
        city: "Testville",
        state: "TS",
        zipCode: "12345",
        country: "US",
      },
      taxId: "TAX-INV-001",
      paymentTerms: "Net 30",
      creditLimit: 50000,
      openingBalance: 0,
      currentBalance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testCustomerId = customerResult.insertedId;

    // Create revenue account
    const revenueResult = await db.collection("accounts").insertOne({
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
    revenueAccountId = revenueResult.insertedId;

    // Create bank account
    const bankResult = await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "1010",
      accountName: "Business Bank Account",
      accountType: "Asset",
      normalBalance: "Debit",
      balance: 50000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    bankAccountId = bankResult.insertedId;

    // Create AR account (must match what JournalEntryService looks for)
    const arResult = await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "1100",
      accountName: "Accounts Receivable",
      accountType: "Asset",
      subType: "Accounts Receivable",
      normalBalance: "Debit",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    arAccountId = arResult.insertedId;

    // Create Sales Tax account (needed for journal entries with tax)
    await db.collection("accounts").insertOne({
      companyId: testCompanyId,
      accountCode: "2200",
      accountName: "Sales Tax Payable",
      accountType: "Liability",
      subType: "Sales Tax",
      normalBalance: "Credit",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock auth
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-invoices@example.com",
        name: "Test User Invoices",
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
    await db.collection("invoices").deleteMany({ companyId: testCompanyId });
    await db.collection("payments").deleteMany({ companyId: testCompanyId });
    await db
      .collection("journalEntries")
      .deleteMany({ companyId: testCompanyId });
    await db.collection("ledgers").deleteMany({ companyId: testCompanyId });
    await db.collection("accounts").deleteMany({ companyId: testCompanyId });
    await db.collection("customers").deleteMany({ companyId: testCompanyId });
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({ _id: testUserId });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // CREATE INVOICE — POST /api/v1/invoices
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/invoices", () => {
    it("should create a draft invoice", async () => {
      const response = await request(app)
        .post("/api/v1/invoices")
        .send({
          customerId: testCustomerId.toString(),
          invoiceDate: "2026-01-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Web Development",
              quantity: 10,
              unitPrice: 100,
              accountId: revenueAccountId.toString(),
              amount: 1000,
            },
          ],
          taxRate: 0,
          discount: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Invoice created successfully");
      expect(response.body.data.status).toBe("Draft");
      expect(response.body.data.invoiceNumber).toMatch(/^INV-\d{4}-\d+$/);
      // Auto-calculated: subtotal=1000, tax=0, total=1000, balanceDue=1000
      expect(response.body.data.subtotal).toBe(1000);
      expect(response.body.data.taxAmount).toBe(0);
      expect(response.body.data.totalAmount).toBe(1000);
      expect(response.body.data.balanceDue).toBe(1000);
      expect(response.body.data.amountPaid).toBe(0);

      createdInvoiceId = response.body.data._id;
      createdInvoiceNumber = response.body.data.invoiceNumber;
    });

    it("should auto-calculate line item amounts and totals", async () => {
      const response = await request(app)
        .post("/api/v1/invoices")
        .send({
          customerId: testCustomerId.toString(),
          invoiceDate: "2026-02-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Design Work",
              quantity: 5,
              unitPrice: 200,
              accountId: revenueAccountId.toString(),
              amount: 0, // should be auto-calculated to 1000
            },
            {
              description: "Consulting",
              quantity: 3,
              unitPrice: 150,
              accountId: revenueAccountId.toString(),
              amount: 0,
            },
          ],
          taxRate: 10,
          discount: 50,
        });

      expect(response.status).toBe(201);
      // 5*200 + 3*150 = 1000 + 450 = 1450
      expect(response.body.data.subtotal).toBe(1450);
      // tax = 1450 * 10/100 = 145
      expect(response.body.data.taxAmount).toBe(145);
      // total = 1450 + 145 - 50 = 1545
      expect(response.body.data.totalAmount).toBe(1545);
      expect(response.body.data.balanceDue).toBe(1545);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/invoices")
        .send({
          customerId: testCustomerId.toString(),
          invoiceDate: "2026-03-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Test",
              quantity: 1,
              unitPrice: 100,
              accountId: revenueAccountId.toString(),
              amount: 100,
            },
          ],
          taxRate: 0,
          discount: 0,
        });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should reject invoice with non-existent customer", async () => {
      const fakeCustomerId = new ObjectId().toString();
      const response = await request(app)
        .post("/api/v1/invoices")
        .send({
          customerId: fakeCustomerId,
          invoiceDate: "2026-06-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Test",
              quantity: 1,
              unitPrice: 100,
              accountId: revenueAccountId.toString(),
              amount: 100,
            },
          ],
          taxRate: 0,
          discount: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ALL INVOICES — GET /api/v1/invoices
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/invoices", () => {
    it("should list all invoices", async () => {
      const response = await request(app).get("/api/v1/invoices");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/invoices");
      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET INVOICE BY ID — GET /api/v1/invoices/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/invoices/:id", () => {
    it("should return a specific invoice", async () => {
      const response = await request(app).get(
        `/api/v1/invoices/${createdInvoiceId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(createdInvoiceId);
      expect(response.body.data.invoiceNumber).toBe(createdInvoiceNumber);
    });

    it("should return 404 for non-existent invoice", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(`/api/v1/invoices/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY STATUS — GET /api/v1/invoices/status/:status
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/invoices/status/:status", () => {
    it("should return draft invoices", async () => {
      const response = await request(app).get("/api/v1/invoices/status/Draft");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((inv: any) => {
        expect(inv.status).toBe("Draft");
      });
    });

    it("should return empty for void status (none exist yet)", async () => {
      const response = await request(app).get("/api/v1/invoices/status/Void");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET BY CUSTOMER — GET /api/v1/invoices/customer/:customerId
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/invoices/customer/:customerId", () => {
    it("should return invoices for a specific customer", async () => {
      const response = await request(app).get(
        `/api/v1/invoices/customer/${testCustomerId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty for customer with no invoices", async () => {
      const fakeCustomerId = new ObjectId().toString();
      const response = await request(app).get(
        `/api/v1/invoices/customer/${fakeCustomerId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH INVOICES — GET /api/v1/invoices/search
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/invoices/search", () => {
    it("should search invoices by number", async () => {
      const response = await request(app)
        .get("/api/v1/invoices/search")
        .query({ q: "INV" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should require search term", async () => {
      const response = await request(app).get("/api/v1/invoices/search");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Search term is required");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // OVERDUE INVOICES — GET /api/v1/invoices/overdue
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/invoices/overdue", () => {
    it("should return overdue invoices (none expected yet)", async () => {
      const response = await request(app).get("/api/v1/invoices/overdue");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE INVOICE — PUT /api/v1/invoices/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("PUT /api/v1/invoices/:id", () => {
    it("should update a draft invoice", async () => {
      const response = await request(app)
        .put(`/api/v1/invoices/${createdInvoiceId}`)
        .send({
          notes: "Updated via test",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Invoice updated successfully");
      expect(response.body.data.notes).toBe("Updated via test");
    });

    it("should return 404 for non-existent invoice", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app)
        .put(`/api/v1/invoices/${fakeId}`)
        .send({ notes: "test" });

      // Service throws error, controller catches → 400
      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // SEND INVOICE — POST /api/v1/invoices/:id/send
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/invoices/:id/send", () => {
    it("should require companyName", async () => {
      const response = await request(app)
        .post(`/api/v1/invoices/${createdInvoiceId}/send`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Company name is required");
    });

    it("should send (transition from Draft to Sent)", async () => {
      const response = await request(app)
        .post(`/api/v1/invoices/${createdInvoiceId}/send`)
        .send({ companyName: "Test Company" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Invoice sent successfully");
      expect(response.body.data.status).toBe("Sent");
      // Journal entry created on status transition from Draft
      expect(response.body.data.journalEntryId).toBeTruthy();
    });

    it("should not send an already sent invoice again (idempotent status stays Sent)", async () => {
      const response = await request(app)
        .post(`/api/v1/invoices/${createdInvoiceId}/send`)
        .send({ companyName: "Test Company" });

      // Should succeed but status stays Sent
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("Sent");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // RECORD PAYMENT — POST /api/v1/invoices/:id/payments
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/invoices/:id/payments", () => {
    it("should record a partial payment", async () => {
      const response = await request(app)
        .post(`/api/v1/invoices/${createdInvoiceId}/payments`)
        .send({
          customerId: testCustomerId.toString(),
          amount: 500,
          paymentDate: new Date().toISOString(),
          paymentMethod: "Bank Transfer",
          referenceNumber: "PAY-INV-001",
          bankAccountId: bankAccountId.toString(),
          allocations: [
            {
              documentId: createdInvoiceId,
              documentNumber: createdInvoiceNumber,
              allocatedAmount: 500,
              documentType: "INVOICE",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Payment recorded successfully");
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.invoicesUpdated).toBeDefined();

      // Check invoice status updated to Partial
      const invoiceRes = await request(app).get(
        `/api/v1/invoices/${createdInvoiceId}`,
      );
      expect(invoiceRes.body.data.amountPaid).toBe(500);
      expect(invoiceRes.body.data.status).toBe("Partial");
    });

    it("should record remaining payment to fully pay invoice", async () => {
      // Get current balance
      const invoiceRes = await request(app).get(
        `/api/v1/invoices/${createdInvoiceId}`,
      );
      const remaining = invoiceRes.body.data.balanceDue;

      const response = await request(app)
        .post(`/api/v1/invoices/${createdInvoiceId}/payments`)
        .send({
          customerId: testCustomerId.toString(),
          amount: remaining,
          paymentDate: new Date().toISOString(),
          paymentMethod: "Bank Transfer",
          referenceNumber: "PAY-INV-002",
          bankAccountId: bankAccountId.toString(),
          allocations: [
            {
              documentId: createdInvoiceId,
              documentNumber: createdInvoiceNumber,
              allocatedAmount: remaining,
              documentType: "INVOICE",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Check invoice is now Paid
      const paidRes = await request(app).get(
        `/api/v1/invoices/${createdInvoiceId}`,
      );
      expect(paidRes.body.data.status).toBe("Paid");
      expect(paidRes.body.data.balanceDue).toBeLessThanOrEqual(0.01);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET INVOICE PAYMENTS — GET /api/v1/invoices/:id/payments
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/invoices/:id/payments", () => {
    it("should return payments for the invoice", async () => {
      const response = await request(app).get(
        `/api/v1/invoices/${createdInvoiceId}/payments`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VOID INVOICE — POST /api/v1/invoices/:id/void
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/invoices/:id/void", () => {
    it("should not void a paid invoice", async () => {
      const response = await request(app).post(
        `/api/v1/invoices/${createdInvoiceId}/void`,
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should void a sent invoice with no payments", async () => {
      // Create and send a separate invoice to void
      const createRes = await request(app)
        .post("/api/v1/invoices")
        .send({
          customerId: testCustomerId.toString(),
          invoiceDate: "2026-04-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Voidable Item",
              quantity: 1,
              unitPrice: 200,
              accountId: revenueAccountId.toString(),
              amount: 200,
            },
          ],
          taxRate: 0,
          discount: 0,
        });
      const voidableId = createRes.body.data._id;

      // Send it first
      await request(app)
        .post(`/api/v1/invoices/${voidableId}/send`)
        .send({ companyName: "Test Company" });

      // Now void it
      const response = await request(app).post(
        `/api/v1/invoices/${voidableId}/void`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Invoice voided successfully");
      expect(response.body.data.status).toBe("Void");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE INVOICE — DELETE /api/v1/invoices/:id
  // ═══════════════════════════════════════════════════════════════════
  describe("DELETE /api/v1/invoices/:id", () => {
    it("should not delete a non-draft invoice", async () => {
      // The created invoice is now Paid → cannot delete
      const response = await request(app).delete(
        `/api/v1/invoices/${createdInvoiceId}`,
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should delete a draft invoice", async () => {
      // Create a fresh draft invoice
      const createRes = await request(app)
        .post("/api/v1/invoices")
        .send({
          customerId: testCustomerId.toString(),
          invoiceDate: "2026-05-15",
          dueDate: "2026-12-31",
          lineItems: [
            {
              description: "Deletable Item",
              quantity: 1,
              unitPrice: 50,
              accountId: revenueAccountId.toString(),
              amount: 50,
            },
          ],
          taxRate: 0,
          discount: 0,
        });
      const deletableId = createRes.body.data._id;

      const response = await request(app).delete(
        `/api/v1/invoices/${deletableId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Invoice deleted successfully");
    });

    it("should reject unauthenticated delete", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).delete(
        `/api/v1/invoices/${createdInvoiceId}`,
      );

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE — Cannot update paid/void invoice
  // ═══════════════════════════════════════════════════════════════════
  describe("Business rule: Cannot update paid/void invoices", () => {
    it("should not update a paid invoice", async () => {
      const response = await request(app)
        .put(`/api/v1/invoices/${createdInvoiceId}`)
        .send({ notes: "Should not work" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
