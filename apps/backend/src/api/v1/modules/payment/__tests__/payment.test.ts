import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

// Get the mocked authServer (cast as any to avoid strict better-auth endpoint types)
const mockedAuthServer = vi.mocked(authServer) as any;

describe("Payment Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let testSupplierId: ObjectId;
  let testCustomerId: ObjectId;
  let testBillId: ObjectId;
  let testInvoiceId: ObjectId;

  let testBankAccountId: ObjectId;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data first
    await db
      .collection("users")
      .deleteMany({ email: { $in: ["test-payment@example.com"] } });
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-payment" });
    await db.collection("accounts").deleteMany({
      _id: {
        $in: [
          new ObjectId("507f1f77bcf86cd799439011"),
          new ObjectId("507f1f77bcf86cd799439012"),
          new ObjectId("507f1f77bcf86cd799439013"),
          new ObjectId("507f1f77bcf86cd799439014"),
        ],
      },
    });
    await db.collection("suppliers").deleteMany({ email: "supplier@test.com" });
    await db.collection("customers").deleteMany({ email: "customer@test.com" });
    await db.collection("bills").deleteMany({ billNumber: "BILL-TEST-001" });
    await db
      .collection("invoices")
      .deleteMany({ invoiceNumber: "INV-TEST-001" });
    await db.collection("payments").deleteMany({});
    await db.collection("journalEntries").deleteMany({});

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Payment Tests",
      slug: "test-company-payment",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("users").insertOne({
      name: "Test User",
      email: "test-payment@example.com",
      username: `test-user-payment-${Date.now()}`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Mock auth to return a valid session for this test user
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-payment@example.com",
        name: "Test User",
        companyId: testCompanyId.toString(),
        role: "admin",
      },
      session: {
        activeOrganizationId: testCompanyId.toString(),
      },
    });

    // Create test supplier
    const supplierResult = await db.collection("suppliers").insertOne({
      companyId: testCompanyId,
      supplierCode: "SUP-TEST-001",
      supplierName: "Test Supplier",
      displayName: "Test Supplier",
      contactPerson: "John Doe",
      email: "supplier@test.com",
      phone: "123456789",
      address: {
        street: "123 Test St",
        city: "Springfield",
        state: "IL",
        zipCode: "62701",
        country: "US",
      },
      taxId: "TAX-SUP-001",
      paymentTerms: "Net 30",
      openingBalance: 0,
      isActive: true,
      createdBy: testUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testSupplierId = supplierResult.insertedId;

    // Create test customer
    const customerResult = await db.collection("customers").insertOne({
      companyId: testCompanyId,
      customerCode: "CUST-TEST-001",
      customerName: "Test Customer",
      displayName: "Test Customer",
      contactPerson: "Jane Doe",
      email: "customer@test.com",
      phone: "987654321",
      billingAddress: {
        street: "456 Test Ave",
        city: "Springfield",
        state: "IL",
        zipCode: "62702",
        country: "US",
      },
      taxId: "TAX-CUST-001",
      paymentTerms: "Net 30",
      creditLimit: 0,
      openingBalance: 0,
      currentBalance: 0,
      isActive: true,
      createdBy: testUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testCustomerId = customerResult.insertedId;

    // Create test accounts
    await db.collection("accounts").insertMany([
      {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        companyId: testCompanyId,
        accountCode: "1000",
        accountName: "Cash on Hand",
        accountType: "Asset",
        subType: "Current Asset",
        description: "Petty cash and cash on hand",
        normalBalance: "Debit",
        balance: 0,
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId("507f1f77bcf86cd799439012"),
        companyId: testCompanyId,
        accountCode: "1100",
        accountName: "Accounts Receivable",
        accountType: "Asset",
        subType: "Accounts Receivable",
        description: "Amounts owed by customers",
        normalBalance: "Debit",
        balance: 0,
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId("507f1f77bcf86cd799439013"),
        companyId: testCompanyId,
        accountCode: "2000",
        accountName: "Accounts Payable",
        accountType: "Liability",
        subType: "Current Liability",
        description: "Amounts owed to suppliers",
        normalBalance: "Credit",
        balance: 0,
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId("507f1f77bcf86cd799439014"),
        companyId: testCompanyId,
        accountCode: "1010",
        accountName: "Bank Account",
        accountType: "Asset",
        subType: "Current Asset",
        description: "Main bank account",
        normalBalance: "Debit",
        balance: 0,
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    testBankAccountId = new ObjectId("507f1f77bcf86cd799439014");

    // Create test bill
    const billResult = await db.collection("bills").insertOne({
      companyId: testCompanyId,
      supplierId: testSupplierId,
      billNumber: "BILL-TEST-001",
      billDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          description: "Test Item",
          quantity: 10,
          unitPrice: 100,
          amount: 1000,
          accountId: new ObjectId("507f1f77bcf86cd799439013"),
        },
      ],
      subtotal: 1000,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      totalAmount: 1000,
      amountPaid: 0,
      balanceDue: 1000,
      status: "Sent",
      createdBy: testUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testBillId = billResult.insertedId;

    // Create test invoice
    const invoiceResult = await db.collection("invoices").insertOne({
      companyId: testCompanyId,
      customerId: testCustomerId,
      invoiceNumber: "INV-TEST-001",
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          description: "Test Service",
          quantity: 5,
          unitPrice: 200,
          amount: 1000,
          accountId: new ObjectId("507f1f77bcf86cd799439012"),
        },
      ],
      subtotal: 1000,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      totalAmount: 1000,
      amountPaid: 0,
      balanceDue: 1000,
      status: "Sent",
      createdBy: testUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testInvoiceId = invoiceResult.insertedId;
  });

  afterAll(async () => {
    const db = mongoClient.db();

    // Clean up test data
    await db.collection("organizations").deleteOne({ _id: testCompanyId });
    await db.collection("users").deleteOne({ _id: testUserId });
    await db.collection("suppliers").deleteOne({ _id: testSupplierId });
    await db.collection("customers").deleteOne({ _id: testCustomerId });
    await db.collection("bills").deleteOne({ _id: testBillId });
    await db.collection("invoices").deleteOne({ _id: testInvoiceId });
    await db.collection("accounts").deleteMany({ companyId: testCompanyId });
    await db.collection("payments").deleteMany({ companyId: testCompanyId });
    await db
      .collection("journalEntries")
      .deleteMany({ companyId: testCompanyId });
    await db.collection("ledger").deleteMany({ companyId: testCompanyId });
    // Also clean up journal entry number counter
    await db.collection("journalEntries").deleteMany({});

    await mongoClient.close();
  });

  describe("POST /api/v1/payments/received", () => {
    it("should record a payment received from customer", async () => {
      const paymentData = {
        customerId: testCustomerId.toString(),
        paymentDate: new Date().toISOString(),
        amount: 500,
        paymentMethod: "Bank Transfer",
        referenceNumber: "REF-001",
        bankAccountId: testBankAccountId.toString(),
        notes: "Partial payment for invoice",
        allocations: [
          {
            documentId: testInvoiceId.toString(),
            documentNumber: "INV-TEST-001",
            allocatedAmount: 500,
            documentType: "INVOICE",
          },
        ],
      };

      const response = await request(app)
        .post("/api/v1/payments/received")
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Payment received recorded successfully",
      );
      expect(response.body.data).toHaveProperty("payment");
      expect(response.body.data.payment).toHaveProperty("_id");
    });

    it("should reject unauthenticated request", async () => {
      // Temporarily mock auth to return null session
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const paymentData = {
        customerId: testCustomerId.toString(),
        paymentDate: new Date().toISOString(),
        amount: 500,
        paymentMethod: "Cash",
      };

      const response = await request(app)
        .post("/api/v1/payments/received")
        .send(paymentData);

      expect(response.status).toBe(401);

      // Restore mock
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should validate payment - require allocations", async () => {
      const paymentData = {
        customerId: testCustomerId.toString(),
        paymentDate: new Date().toISOString(),
        amount: -100,
        paymentMethod: "Cash",
        bankAccountId: testBankAccountId.toString(),
        allocations: [],
      };

      const response = await request(app)
        .post("/api/v1/payments/received")
        .send(paymentData);

      // Expect error (service throws for empty allocations)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /api/v1/payments/received", () => {
    it("should get all payments received", async () => {
      const response = await request(app)
        .get("/api/v1/payments/received")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);
    });

    it("should reject unauthenticated request", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/payments/received");

      expect(response.status).toBe(401);

      mockedAuthServer.api.getSession = originalMock;
    });
  });

  describe("POST /api/v1/payments/made", () => {
    it("should record a payment made to supplier", async () => {
      const paymentData = {
        supplierId: testSupplierId.toString(),
        paymentDate: new Date().toISOString(),
        amount: 600,
        paymentMethod: "Check",
        referenceNumber: "CHK-001",
        bankAccountId: testBankAccountId.toString(),
        notes: "Payment for bill",
        allocations: [
          {
            documentId: testBillId.toString(),
            documentNumber: "BILL-TEST-001",
            allocatedAmount: 600,
            documentType: "BILL",
          },
        ],
      };

      const response = await request(app)
        .post("/api/v1/payments/made")
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Payment made recorded successfully");
      expect(response.body.data).toHaveProperty("payment");
    });
  });

  describe("GET /api/v1/payments/made", () => {
    it("should get all payments made", async () => {
      const response = await request(app)
        .get("/api/v1/payments/made")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);
    });

    it("should reject unauthenticated request", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/payments/made");

      expect(response.status).toBe(401);

      mockedAuthServer.api.getSession = originalMock;
    });
  });

  describe("Payment Journal Entries", () => {
    it("should create journal entry when recording payment", async () => {
      const paymentData = {
        customerId: testCustomerId.toString(),
        paymentDate: new Date().toISOString(),
        amount: 250,
        paymentMethod: "Cash",
        referenceNumber: "CASH-001",
        bankAccountId: testBankAccountId.toString(),
        allocations: [
          {
            documentId: testInvoiceId.toString(),
            documentNumber: "INV-TEST-001",
            allocatedAmount: 250,
            documentType: "INVOICE",
          },
        ],
      };

      const response = await request(app)
        .post("/api/v1/payments/received")
        .send(paymentData);

      // Only check for journal entries if payment was created successfully
      if (response.status === 201) {
        const db = mongoClient.db();
        const journalEntries = await db
          .collection("journalEntries")
          .find({})
          .toArray();

        expect(journalEntries.length).toBeGreaterThan(0);
      } else {
        // If payment failed, skip journal entry check but don't fail
        expect(response.status).toBe(201);
      }
    });
  });
});
