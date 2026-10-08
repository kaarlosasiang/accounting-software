/**
 * Security regression tests for privileged / unauthenticated endpoints.
 */
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import configureApp from "../config/app.js";
import { constants } from "../config/index.js";
import { authServer } from "../modules/auth/betterAuth.js";

const mockedAuthServer = vi.mocked(authServer) as any;

describe("Security regressions", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let userId: ObjectId;
  let otherUserId: ObjectId;
  const companyId = new ObjectId();

  const sessionAs = (role: string) =>
    vi.fn().mockResolvedValue({
      user: { id: userId.toString(), email: "sec@example.com", role },
      session: { activeOrganizationId: companyId.toString() },
    });

  beforeAll(async () => {
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();
    const db = mongoClient.db();

    userId = (
      await db.collection("users").insertOne({
        email: "sec@example.com",
        username: `sec-${Date.now()}`,
        role: "user",
      })
    ).insertedId;
    otherUserId = (
      await db.collection("users").insertOne({
        email: "sec-other@example.com",
        username: `sec-other-${Date.now()}`,
        role: "user",
      })
    ).insertedId;
  });

  afterAll(async () => {
    const db = mongoClient.db();
    await db
      .collection("users")
      .deleteMany({ _id: { $in: [userId, otherUserId] } });
    await mongoClient.close();
  });

  describe("/api/v1/subscriptions", () => {
    it("returns 401 without a session", async () => {
      mockedAuthServer.api.getSession = vi.fn().mockResolvedValue(null);
      const res = await request(app).get(
        `/api/v1/subscriptions/${otherUserId.toString()}`,
      );
      expect(res.status).toBe(401);

      const activate = await request(app)
        .post("/api/v1/subscriptions/activate")
        .send({ userId: otherUserId.toString(), planId: "pro" });
      expect(activate.status).toBe(401);
    });

    it("returns 403 when acting on another user's subscription", async () => {
      mockedAuthServer.api.getSession = sessionAs("user");

      const read = await request(app).get(
        `/api/v1/subscriptions/${otherUserId.toString()}`,
      );
      expect(read.status).toBe(403);

      const activate = await request(app)
        .post("/api/v1/subscriptions/activate")
        .send({ userId: otherUserId.toString(), planId: "pro" });
      expect(activate.status).toBe(403);

      const cancel = await request(app).delete(
        `/api/v1/subscriptions/${otherUserId.toString()}`,
      );
      expect(cancel.status).toBe(403);

      const other = await mongoClient
        .db()
        .collection("users")
        .findOne({ _id: otherUserId });
      expect(other?.hasActiveSubscription).toBeUndefined();
    });

    it("allows a user to read their own subscription", async () => {
      mockedAuthServer.api.getSession = sessionAs("user");
      const res = await request(app).get(
        `/api/v1/subscriptions/${userId.toString()}`,
      );
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });

  describe("POST /api/v1/users/update-role", () => {
    it("returns 403 for a non-admin (e.g. an org owner)", async () => {
      mockedAuthServer.api.getSession = sessionAs("user");
      const res = await request(app).post("/api/v1/users/update-role").send({
        userId: userId.toString(),
        role: "super_admin",
        companyId: companyId.toString(),
      });
      expect(res.status).toBe(403);

      const user = await mongoClient
        .db()
        .collection("users")
        .findOne({ _id: userId });
      expect(user?.role).toBe("user");
    });

    it("rejects arbitrary role strings even for admins", async () => {
      mockedAuthServer.api.getSession = sessionAs("admin");
      const res = await request(app).post("/api/v1/users/update-role").send({
        userId: otherUserId.toString(),
        role: "god-mode",
        companyId: companyId.toString(),
      });
      expect(res.status).toBe(400);
    });
  });
});
