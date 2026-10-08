import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { rateLimit } from "../rateLimit.middleware.js";

const appWith = (max: number, enabled = true) => {
  const app = express();
  app.use(rateLimit({ name: "test", windowMs: 60_000, max, enabled }));
  app.get("/", (_req, res) => {
    res.json({ ok: true });
  });
  return app;
};

describe("rateLimit middleware", () => {
  it("allows up to `max` requests then returns 429 with Retry-After", async () => {
    const app = appWith(3);
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.headers["ratelimit-remaining"]).toBe(String(2 - i));
    }
    const blocked = await request(app).get("/");
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("is a no-op when disabled", async () => {
    const app = appWith(1, false);
    await request(app).get("/");
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });
});
