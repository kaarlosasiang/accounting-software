import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import configureApp from "../../../config/app.js";
import { constants } from "../../../config/index.js";
import { authServer } from "../../../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Period Module", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;
  let createdPeriodId: string;

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    // Clean up stale test data
    await db
      .collection("users")
      .deleteMany({ email: "test-periods@example.com" });
    await db
      .collection("organizations")
      .deleteMany({ slug: "test-company-periods" });
    await db.collection("accountingperiods").deleteMany({
      fiscalYear: 2099,
    });

    // Create test company
    const companyResult = await db.collection("organizations").insertOne({
      name: "Test Company - Period Tests",
      slug: "test-company-periods",
      metadata: {},
      createdAt: new Date(),
    });
    testCompanyId = companyResult.insertedId;

    // Create test user
    const userResult = await db.collection("users").insertOne({
      name: "Test User Periods",
      email: "test-periods@example.com",
      username: `test-user-periods-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testUserId = userResult.insertedId;

    // Mock authenticated session
    mockedAuthServer.api.getSession = vi.fn().mockResolvedValue({
      user: {
        id: testUserId.toString(),
        email: "test-periods@example.com",
        name: "Test User Periods",
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
      .collection("accountingperiods")
      .deleteMany({ companyId: testCompanyId });
    await db.collection("organizations").deleteMany({ _id: testCompanyId });
    await db.collection("users").deleteMany({ _id: testUserId });
    await mongoClient.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // CREATE PERIOD — POST /api/v1/periods
  // ═══════════════════════════════════════════════════════════════════
  describe("POST /api/v1/periods", () => {
    it("should create a new accounting period", async () => {
      const response = await request(app).post("/api/v1/periods").send({
        periodName: "January 2099",
        periodType: "Monthly",
        fiscalYear: 2099,
        startDate: "2099-01-01",
        endDate: "2099-01-31",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.periodName).toBe("January 2099");
      expect(response.body.data.periodType).toBe("Monthly");
      expect(response.body.data.status).toBe("Open");
      expect(response.body.data.fiscalYear).toBe(2099);

      createdPeriodId = response.body.data._id;
    });

    it("should reject overlapping periods", async () => {
      const response = await request(app).post("/api/v1/periods").send({
        periodName: "January 2099 Duplicate",
        periodType: "Monthly",
        fiscalYear: 2099,
        startDate: "2099-01-15", // overlaps with existing 2099-01-01 to 2099-01-31
        endDate: "2099-02-15",
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it("should require periodName, periodType, fiscalYear, startDate, endDate", async () => {
      const response = await request(app).post("/api/v1/periods").send({
        periodName: "Incomplete Period",
        // missing other required fields
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).post("/api/v1/periods").send({
        periodName: "February 2099",
        periodType: "Monthly",
        fiscalYear: 2099,
        startDate: "2099-02-01",
        endDate: "2099-02-28",
      });

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ALL PERIODS — GET /api/v1/periods
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/periods", () => {
    it("should list all periods for the company", async () => {
      const response = await request(app).get("/api/v1/periods");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it("should filter by fiscalYear", async () => {
      const response = await request(app).get(
        "/api/v1/periods?fiscalYear=2099",
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach((p: any) => {
        expect(p.fiscalYear).toBe(2099);
      });
    });

    it("should filter by status", async () => {
      const response = await request(app).get("/api/v1/periods?status=Open");

      expect(response.status).toBe(200);
      response.body.data.forEach((p: any) => {
        expect(p.status).toBe("Open");
      });
    });

    it("should reject unauthenticated requests", async () => {
      const originalMock = mockedAuthServer.api.getSession;
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);

      const response = await request(app).get("/api/v1/periods");

      expect(response.status).toBe(401);
      mockedAuthServer.api.getSession = originalMock;
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET PERIOD BY ID — GET /api/v1/periods/:periodId
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/periods/:periodId", () => {
    it("should return a specific period", async () => {
      const response = await request(app).get(
        `/api/v1/periods/${createdPeriodId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(createdPeriodId);
      expect(response.body.data.periodName).toBe("January 2099");
    });

    it("should return 404 for non-existent period", async () => {
      const fakeId = new ObjectId().toString();
      const response = await request(app).get(`/api/v1/periods/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // CHECK DATE — GET /api/v1/periods/check-date
  // ═══════════════════════════════════════════════════════════════════
  describe("GET /api/v1/periods/check-date", () => {
    it("should check if a date falls in a closed period", async () => {
      const response = await request(app).get(
        "/api/v1/periods/check-date?date=2099-01-15",
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("isClosed");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE PERIOD — DELETE /api/v1/periods/:periodId
  // ═══════════════════════════════════════════════════════════════════
  describe("DELETE /api/v1/periods/:periodId", () => {
    it("should delete an open period", async () => {
      const response = await request(app).delete(
        `/api/v1/periods/${createdPeriodId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify it's deleted
      const getResponse = await request(app).get(
        `/api/v1/periods/${createdPeriodId}`,
      );
      expect(getResponse.status).toBe(404);
    });
  });
});
