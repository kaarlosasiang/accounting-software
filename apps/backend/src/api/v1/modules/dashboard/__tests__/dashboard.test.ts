import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Dashboard Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data
    await db
      .collection("users")
      .deleteMany({ email: "test-dashboard@example.com" });
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-dashboard" });

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Dashboard Tests",
      slug: "test-company-dashboard",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("users").insertOne({
      name: "Test User Dashboard",
      email: "test-dashboard@example.com",
      username: `test-user-dashboard-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Mock authenticated session
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-dashboard@example.com",
        name: "Test User Dashboard",
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
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({ _id: testUserId });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET OVERVIEW — GET /api/v1/dashboard/overview
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/dashboard/overview", () => {
    it("should return dashboard overview with all required fields", async () => {
      const response = await request(app).get("/api/v1/dashboard/overview");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { data } = response.body;
      expect(data).toHaveProperty("kpis");
      expect(data).toHaveProperty("outstandingInvoices");
      expect(data).toHaveProperty("outstandingBills");
      expect(data).toHaveProperty("recentTransactions");
      expect(data).toHaveProperty("monthlyTrend");

      // KPIs shape
      expect(data.kpis).toHaveProperty("ytdRevenue");
      expect(data.kpis).toHaveProperty("ytdExpenses");
      expect(data.kpis).toHaveProperty("ytdProfit");
      expect(data.kpis).toHaveProperty("monthRevenue");

      // monthlyTrend is an array of 12 months
      expect(Array.isArray(data.monthlyTrend)).toBe(true);
      expect(data.monthlyTrend).toHaveLength(12);
      expect(data.monthlyTrend[0]).toHaveProperty("month");
      expect(data.monthlyTrend[0]).toHaveProperty("revenue");
      expect(data.monthlyTrend[0]).toHaveProperty("expenses");
      expect(data.monthlyTrend[0]).toHaveProperty("profit");

      // Outstanding objects shape
      expect(data.outstandingInvoices).toHaveProperty("count");
      expect(data.outstandingInvoices).toHaveProperty("totalBalance");
      expect(data.outstandingInvoices).toHaveProperty("overdueCount");

      // Recent transactions is an array
      expect(Array.isArray(data.recentTransactions)).toBe(true);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/dashboard/overview");

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });

    it("should return zero values for a company with no transactions", async () => {
      const response = await request(app).get("/api/v1/dashboard/overview");

      expect(response.status).toBe(200);
      const { kpis } = response.body.data;
      // Fresh test company should have 0 revenue/expenses
      expect(kpis.ytdRevenue).toBe(0);
      expect(kpis.ytdExpenses).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ANALYTICS — GET /api/v1/dashboard/analytics
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/dashboard/analytics", () => {
    it("should return analytics data with required fields", async () => {
      const response = await request(app).get("/api/v1/dashboard/analytics");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { data } = response.body;
      expect(data).toHaveProperty("year");
      expect(data).toHaveProperty("monthlyTrend");
      expect(data).toHaveProperty("revenueByCategory");
      expect(data).toHaveProperty("expenseByCategory");

      expect(typeof data.year).toBe("number");
      expect(Array.isArray(data.monthlyTrend)).toBe(true);
      expect(data.monthlyTrend).toHaveLength(12);
      expect(Array.isArray(data.revenueByCategory)).toBe(true);
      expect(Array.isArray(data.expenseByCategory)).toBe(true);
    });

    it("should default to the current year", async () => {
      const response = await request(app).get("/api/v1/dashboard/analytics");

      expect(response.status).toBe(200);
      expect(response.body.data.year).toBe(new Date().getFullYear());
    });

    it("should accept a specific year query parameter", async () => {
      const response = await request(app).get(
        "/api/v1/dashboard/analytics?year=2024",
      );

      expect(response.status).toBe(200);
      expect(response.body.data.year).toBe(2024);
      expect(response.body.data.monthlyTrend).toHaveLength(12);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/dashboard/analytics");

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });
});
