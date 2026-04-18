import { config } from "dotenv";
import mongoose from "mongoose";
import { afterAll, beforeAll, vi } from "vitest";

// Load test environment variables
config({ path: ".env.test", override: false });
config({ path: ".env", override: false });

// Set test environment
process.env.NODE_ENV = "test";

// Mock env.ts to avoid import.meta.url issues
vi.mock("../config/env.js", () => ({
  default: { config: vi.fn() },
}));

// Mock selected schemas while preserving the real RBAC enums/permissions exports.
const createPassthroughSchema = () => ({
  safeParse: (data: any) => ({ success: true, data }),
  partial: () => ({
    safeParse: (data: any) => ({ success: true, data }),
  }),
});
vi.mock("@sas/validators", async () => {
  const actual = await vi.importActual<any>("@sas/validators");
  return {
    ...actual,
    subscriptionActivationSchema: createPassthroughSchema(),
    subscriptionCancellationSchema: createPassthroughSchema(),
    accountSchema: createPassthroughSchema(),
    customerSchema: createPassthroughSchema(),
    supplierSchema: createPassthroughSchema(),
    inventoryItemSchema: createPassthroughSchema(),
    createBillSchema: createPassthroughSchema(),
    updateBillSchema: createPassthroughSchema(),
  };
});

// Mock the authServer export so requireAuth middleware can call api.getSession
vi.mock("../modules/auth/betterAuth.js", () => ({
  authServer: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
    handler: vi.fn(),
  },
}));

// Mock better-auth modules before importing anything that uses them
vi.mock("better-auth/node", () => ({
  toNodeHandler: vi.fn(() => (req: any, res: any, next: any) => {
    next();
  }),
  fromNodeHeaders: vi.fn(() => ({})),
}));

vi.mock("better-auth/adapters/mongodb", () => ({
  mongodbAdapter: vi.fn(() => ({})),
}));

vi.mock("better-auth/plugins", () => ({
  admin: vi.fn(() => ({})),
  emailOTP: vi.fn(() => ({})),
  oneTap: vi.fn(() => ({})),
  organization: vi.fn(() => ({})),
}));

vi.mock("better-auth", () => ({
  betterAuth: vi.fn(() => ({
    handler: vi.fn(),
    createAPIClient: vi.fn(),
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  })),
}));

// Connect Mongoose before all tests so Mongoose models can query the DB
beforeAll(async () => {
  const mongoUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "rrd10-sas";
  if (mongoUri && mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { dbName });
  }
});

// Disconnect Mongoose after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
