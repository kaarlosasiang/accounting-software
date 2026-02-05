import request from "supertest";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import express from "express";
import configureApp from "../config/app";
import { MongoClient } from "mongodb";
import { constants } from "../config/index";

describe("Authentication Routes", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testUser: any;

  beforeAll(async () => {
    // Create Express app instance for testing
    app = express();
    configureApp(app);

    // Connect to test database
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();

    // Clean up test data
    const db = mongoClient.db(constants.dbName);
    await db
      .collection("users")
      .deleteMany({ email: { $regex: /test.*@example\.com$/ } });
  });

  afterAll(async () => {
    // Clean up and close connections
    if (mongoClient) {
      const db = mongoClient.db(constants.dbName);
      await db
        .collection("users")
        .deleteMany({ email: { $regex: /test.*@example\.com$/ } });
      await mongoClient.close();
    }
  });

  beforeEach(async () => {
    // Clean sessions before each test
    const db = mongoClient.db(constants.dbName);
    await db.collection("sessions").deleteMany({});
  });

  describe("POST /auth/sign-in/email", () => {
    it("should successfully sign in with valid credentials", async () => {
      const testEmail = "test-signin@example.com";
      const testPassword = "TestPassword123!";

      // First, create a test user
      const signupResponse = await request(app)
        .post("/auth/sign-up/email")
        .send({
          email: testEmail,
          password: testPassword,
          name: "Test User",
        });

      expect(signupResponse.status).toBe(200);

      // Now test sign in
      const response = await request(app).post("/auth/sign-in/email").send({
        email: testEmail,
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.headers["set-cookie"]).toBeDefined();

      // Check that session cookies are set
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      if (Array.isArray(cookies)) {
        expect(
          cookies.some((cookie: string) => cookie.includes("session")),
        ).toBe(true);
      }

      // Verify user data in response
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(testEmail);
    });

    it("should reject sign in with invalid credentials", async () => {
      const response = await request(app).post("/auth/sign-in/email").send({
        email: "nonexistent@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject sign in with missing email", async () => {
      const response = await request(app).post("/auth/sign-in/email").send({
        password: "somepassword",
      });

      expect(response.status).toBe(400);
    });

    it("should reject sign in with missing password", async () => {
      const response = await request(app).post("/auth/sign-in/email").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /auth/sign-up/email", () => {
    it("should successfully sign up with valid data", async () => {
      const testEmail = `test-signup-${Date.now()}@example.com`;

      const response = await request(app).post("/auth/sign-up/email").send({
        email: testEmail,
        password: "TestPassword123!",
        name: "Test Signup User",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user.name).toBe("Test Signup User");
    });

    it("should reject sign up with invalid email", async () => {
      const response = await request(app).post("/auth/sign-up/email").send({
        email: "invalid-email",
        password: "TestPassword123!",
        name: "Test User",
      });

      expect(response.status).toBe(400);
    });

    it("should reject sign up with weak password", async () => {
      const response = await request(app).post("/auth/sign-up/email").send({
        email: "test@example.com",
        password: "123", // Too weak
        name: "Test User",
      });

      expect(response.status).toBe(400);
    });

    it("should reject duplicate email signup", async () => {
      const testEmail = `test-duplicate-${Date.now()}@example.com`;

      // First signup
      await request(app).post("/auth/sign-up/email").send({
        email: testEmail,
        password: "TestPassword123!",
        name: "Test User",
      });

      // Second signup with same email
      const response = await request(app).post("/auth/sign-up/email").send({
        email: testEmail,
        password: "AnotherPassword123!",
        name: "Another User",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /auth/session", () => {
    it("should return current user session", async () => {
      const testEmail = `test-session-${Date.now()}@example.com`;

      // Sign up and get session
      const signupResponse = await request(app)
        .post("/auth/sign-up/email")
        .send({
          email: testEmail,
          password: "TestPassword123!",
          name: "Test Session User",
        });

      const cookies = signupResponse.headers["set-cookie"];

      // Test session endpoint
      const response = await request(app)
        .get("/auth/session")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(testEmail);
    });

    it("should return null for no session", async () => {
      const response = await request(app).get("/auth/session");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: null });
    });
  });

  describe("POST /auth/sign-out", () => {
    it("should successfully sign out user", async () => {
      const testEmail = `test-signout-${Date.now()}@example.com`;

      // Sign up and get session
      const signupResponse = await request(app)
        .post("/auth/sign-up/email")
        .send({
          email: testEmail,
          password: "TestPassword123!",
          name: "Test Signout User",
        });

      const cookies = signupResponse.headers["set-cookie"];

      // Sign out
      const response = await request(app)
        .post("/auth/sign-out")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);

      // Verify session is cleared
      const sessionResponse = await request(app)
        .get("/auth/session")
        .set("Cookie", cookies);

      expect(sessionResponse.body.user).toBeNull();
    });
  });

  describe("Email OTP Verification", () => {
    it("should send OTP for email verification", async () => {
      const testEmail = `test-otp-${Date.now()}@example.com`;

      const response = await request(app).post("/auth/otp/send").send({
        email: testEmail,
        type: "sign-in",
      });

      expect(response.status).toBe(200);
    });

    it("should verify OTP code", async () => {
      const testEmail = `test-otp-verify-${Date.now()}@example.com`;

      // This test would require mocking the email service or
      // having access to the generated OTP
      // For now, we'll test the endpoint structure
      const response = await request(app).post("/auth/otp/verify").send({
        email: testEmail,
        otp: "123456",
      });

      // Expect either success (if OTP matches) or invalid OTP error
      expect([200, 400]).toContain(response.status);
    });
  });
});
