import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";

describe("Payment Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let testSupplierId: ObjectId;
  let testCustomerId: ObjectId;
  let testBillId: ObjectId;
  let testInvoiceId: ObjectId;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

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

    // Create test supplier
    const supplierResult = await db.collection("suppliers").insertOne({
      companyId: testCompanyId,
      supplierName: "Test Supplier",
      contactPerson: "John Doe",
      email: "supplier@test.com",
      phone: "123456789",
      address: "123 Test St",
      paymentTerms: "Net 30",
      status: "active",
      createdBy: testUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testSupplierId = supplierResult.insertedId;

    // Create test customer
    const customerResult = await db.collection("customers").insertOne({
      companyId: testCompanyId,
      customerName: "Test Customer",
      contactPerson: "Jane Doe",
      email: "customer@test.com",
      phone: "987654321",
      address: "456 Test Ave",
      paymentTerms: "Net 30",
      status: "active",
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
        normalBalance: "debit",
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
        subType: "Current Asset",
        description: "Amounts owed by customers",
        normalBalance: "debit",
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
        normalBalance: "credit",
        isActive: true,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create test bill
    const billResult = await db.collection("bills").insertOne({
      companyId: testCompanyId,
      supplierId: testSupplierId,
      billNumber: "BILL-TEST-001",
      billDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        {
          description: "Test Item",
          quantity: 10,
          unitPrice: 100,
          amount: 1000,
          accountId: new ObjectId("507f1f77bcf86cd799439013"),
        },
      ],
      subtotal: 1000,
      taxAmount: 0,
      totalAmount: 1000,
      status: "pending",
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
      items: [
        {
          description: "Test Service",
          quantity: 5,
          unitPrice: 200,
          amount: 1000,
          accountId: new ObjectId("507f1f77bcf86cd799439012"),
        },
      ],
      subtotal: 1000,
      taxAmount: 0,
      totalAmount: 1000,
      status: "pending",
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
      .collection("journal_entries")
      .deleteMany({ companyId: testCompanyId });
    await db.collection("ledger").deleteMany({ companyId: testCompanyId });

    await mongoClient.close();
  });

  describe("POST /api/v1/payments/received", () => {
    it("should record a payment received from customer", async () => {
      const paymentData = {
        companyId: testCompanyId.toString(),
        customerId: testCustomerId.toString(),
        paymentDate: new Date().toISOString(),
        amount: 500,
        paymentMethod: "bank_transfer",
        referenceNumber: "REF-001",
        notes: "Partial payment for invoice",
        invoiceAllocations: [
          {
            invoiceId: testInvoiceId.toString(),
            amount: 500,
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
      expect(response.body.data.payment.amount).toBe(500);
    });

    it("should require companyId", async () => {
      const paymentData = {
        customerId: testCustomerId.toString(),
        paymentDate: new Date().toISOString(),
        amount: 500,
        paymentMethod: "cash",
      };

      const response = await request(app)
        .post("/api/v1/payments/received")
        .send(paymentData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should validate payment amount", async () => {
      const paymentData = {
        companyId: testCompanyId.toString(),
        customerId: testCustomerId.toString(),
        paymentDate: new Date().toISOString(),
        amount: -100, // Invalid negative amount
        paymentMethod: "cash",
      };

      const response = await request(app)
        .post("/api/v1/payments/received")
        .send(paymentData);

      // Expect validation error (400 or 422)
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
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

    it("should require companyId", async () => {
      const response = await request(app).get("/api/v1/payments/received");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });
  });

  describe("POST /api/v1/payments/made", () => {
    it("should record a payment made to supplier", async () => {
      const paymentData = {
        companyId: testCompanyId.toString(),
        supplierId: testSupplierId.toString(),
        paymentDate: new Date().toISOString(),
        amount: 600,
        paymentMethod: "check",
        referenceNumber: "CHK-001",
        notes: "Payment for bill",
        billAllocations: [
          {
            billId: testBillId.toString(),
            amount: 600,
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
      expect(response.body.data.payment.amount).toBe(600);
    });

    it("should require companyId", async () => {
      const paymentData = {
        supplierId: testSupplierId.toString(),
        paymentDate: new Date().toISOString(),
        amount: 600,
        paymentMethod: "cash",
      };

      const response = await request(app)
        .post("/api/v1/payments/made")
        .send(paymentData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
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

    it("should require companyId", async () => {
      const response = await request(app).get("/api/v1/payments/made");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });
  });

  describe("Payment Journal Entries", () => {
    it("should create journal entry when recording payment", async () => {
      const paymentData = {
        companyId: testCompanyId.toString(),
        customerId: testCustomerId.toString(),
        paymentDate: new Date().toISOString(),
        amount: 250,
        paymentMethod: "cash",
        referenceNumber: "CASH-001",
      };

      await request(app).post("/api/v1/payments/received").send(paymentData);

      const db = mongoClient.db();
      const journalEntries = await db
        .collection("journal_entries")
        .find({
          companyId: testCompanyId,
          description: { $regex: /payment/i },
        })
        .toArray();

      expect(journalEntries.length).toBeGreaterThan(0);
    });
  });
});
