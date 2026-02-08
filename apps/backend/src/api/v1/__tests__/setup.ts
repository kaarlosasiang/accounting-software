import { config } from "dotenv";

// Load test environment variables
config({ path: ".env" });

// Set test environment
process.env.NODE_ENV = "test";

// Mock env.ts to avoid import.meta.url issues
jest.mock("../config/env.js", () => ({
  default: { config: jest.fn() },
}));

// Mock @rrd10-sas/validators to avoid ESM transformation issues
jest.mock("@rrd10-sas/validators", () => ({
  subscriptionActivationSchema: {},
  subscriptionCancellationSchema: {},
  // Add other schemas as needed
}));

// Mock better-auth modules before importing anything that uses them
jest.mock(
  "better-auth/node",
  () => ({
    toNodeHandler: jest.fn(() => (req: any, res: any, next: any) => {
      // Mock auth handler that just calls next()
      next();
    }),
  }),
  { virtual: true },
);

jest.mock(
  "better-auth/adapters/mongodb",
  () => ({
    mongodbAdapter: jest.fn(() => ({})),
  }),
  { virtual: true },
);

jest.mock(
  "better-auth/plugins",
  () => ({
    admin: jest.fn(() => ({})),
    emailOTP: jest.fn(() => ({})),
    oneTap: jest.fn(() => ({})),
    organization: jest.fn(() => ({})),
  }),
  { virtual: true },
);

jest.mock(
  "better-auth",
  () => ({
    betterAuth: jest.fn(() => ({
      handler: jest.fn(),
      createAPIClient: jest.fn(),
    })),
  }),
  { virtual: true },
);

// Increase timeout for database operations
jest.setTimeout(30000);
