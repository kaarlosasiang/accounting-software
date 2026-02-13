# Testing Best Practices for Accounting Software

This document outlines the testing standards and best practices for the accounting software backend API.

## Table of Contents

1. [Test Structure](#test-structure)
2. [Naming Conventions](#naming-conventions)
3. [Test Data Management](#test-data-management)
4. [Running Tests](#running-tests)
5. [Writing Effective Tests](#writing-effective-tests)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Test Structure

### File Organization

```
apps/backend/src/api/v1/
├── __tests__/
│   ├── setup.ts              # Global test setup and mocks
│   ├── testUtils.ts          # Reusable test utilities
│   └── auth.test.ts          # Example test file
└── modules/
    ├── payment/
    │   ├── __tests__/
    │   │   └── payment.test.ts
    │   ├── paymentController.ts
    │   ├── paymentService.ts
    │   └── paymentRoutes.ts
    └── report/
        ├── __tests__/
        │   └── report.test.ts
        ├── reportController.ts
        ├── reportService.ts
        └── reportRoutes.ts
```

### Test File Structure

Each test file should follow this structure:

```typescript
import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import express from "express";
import configureApp from "../../../config/app.js";
import { MongoClient, ObjectId } from "mongodb";
import constants from "../../../config/index.js";

describe("Module Name", () => {
  let mongoClient: MongoClient;
  let app: express.Application;
  let testCompanyId: ObjectId;
  let testUserId: ObjectId;

  beforeAll(async () => {
    // Setup: Create app, connect to database, seed test data
    app = express();
    configureApp(app);
    mongoClient = new MongoClient(constants.mongodbUri);
    await mongoClient.connect();

    // Create test data
    const db = mongoClient.db();
    // ... create test company, user, accounts, etc.
  });

  afterAll(async () => {
    // Cleanup: Delete test data, close connections
    const db = mongoClient.db();
    await db.collection("organizations").deleteOne({ _id: testCompanyId });
    // ... delete all test data
    await mongoClient.close();
  });

  describe("Endpoint Group", () => {
    it("should perform expected behavior", async () => {
      const response = await request(app)
        .get("/api/v1/endpoint")
        .query({ companyId: testCompanyId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

---

## Naming Conventions

### Test File Names

- Use `.test.ts` extension
- Name should match the module being tested: `payment.test.ts`, `report.test.ts`
- Place in `__tests__` folder within the module directory

### Test Descriptions

```typescript
// ✅ GOOD: Clear, descriptive names
describe("Payment Module", () => {
  describe("POST /api/v1/payments/received", () => {
    it("should record a payment received from customer", async () => {
      // ...
    });

    it("should require companyId", async () => {
      // ...
    });

    it("should validate payment amount", async () => {
      // ...
    });
  });
});

// ❌ BAD: Vague names
describe("Payment", () => {
  it("works", async () => {
    // ...
  });
});
```

### Variable Naming

```typescript
// ✅ GOOD: Descriptive variable names
let testCompanyId: ObjectId;
let testUserId: ObjectId;
let cashAccountId: ObjectId;

// ❌ BAD: Generic names
let id1: ObjectId;
let obj: ObjectId;
```

---

## Test Data Management

### Using Test Utilities

We provide reusable test utilities in `__tests__/testUtils.ts`:

```typescript
import {
  createTestCompany,
  createTestUser,
  createTestChartOfAccounts,
  createTestSupplier,
  createTestCustomer,
  cleanupTestData,
} from "../../../__tests__/testUtils.js";

// In beforeAll
const testCompany = await createTestCompany(db, "Test Company Name");
const testUser = await createTestUser(db, "test@example.com");
const accounts = await createTestChartOfAccounts(
  db,
  testCompany._id,
  testUser._id,
);

// In afterAll
await cleanupTestData(db, testCompany._id, testUser._id);
```

### Best Practices for Test Data

1. **Isolate test data**: Each test suite should create its own data
2. **Use unique identifiers**: Use timestamps or random strings to avoid collisions
3. **Clean up after tests**: Always delete test data in `afterAll`
4. **Use realistic data**: Test data should resemble production data
5. **Minimize data**: Only create the minimum data needed for the test

```typescript
// ✅ GOOD: Unique test data
const testEmail = `test-${Date.now()}@example.com`;

// ❌ BAD: Reusing same email (may cause conflicts)
const testEmail = "test@example.com";
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- payment.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should record a payment"
```

### Configuration

Jest configuration is in `jest.config.js`:

```javascript
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/api/v1/__tests__/setup.ts"],
};
```

---

## Writing Effective Tests

### Test Structure: AAA Pattern

Follow the **Arrange-Act-Assert** pattern:

```typescript
it("should record a payment received from customer", async () => {
  // ARRANGE: Set up test data
  const paymentData = {
    companyId: testCompanyId.toString(),
    customerId: testCustomerId.toString(),
    amount: 500,
    paymentMethod: "bank_transfer",
  };

  // ACT: Perform the action
  const response = await request(app)
    .post("/api/v1/payments/received")
    .send(paymentData);

  // ASSERT: Verify the results
  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  expect(response.body.data.payment.amount).toBe(500);
});
```

### What to Test

#### 1. Happy Path (Success Cases)

```typescript
it("should generate balance sheet with correct structure", async () => {
  const response = await request(app)
    .get("/api/v1/reports/balance-sheet")
    .query({ companyId: testCompanyId.toString() });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toHaveProperty("assets");
  expect(response.body.data).toHaveProperty("liabilities");
  expect(response.body.data).toHaveProperty("equity");
});
```

#### 2. Validation (Error Cases)

```typescript
it("should require companyId", async () => {
  const response = await request(app).get("/api/v1/reports/balance-sheet");

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Unauthorized");
});

it("should validate payment amount", async () => {
  const paymentData = {
    companyId: testCompanyId.toString(),
    amount: -100, // Invalid
  };

  const response = await request(app)
    .post("/api/v1/payments/received")
    .send(paymentData);

  expect(response.status).toBeGreaterThanOrEqual(400);
});
```

#### 3. Business Logic

```typescript
it("should verify accounting equation: Assets = Liabilities + Equity", async () => {
  const response = await request(app)
    .get("/api/v1/reports/balance-sheet")
    .query({ companyId: testCompanyId.toString() });

  const { equation, balanced } = response.body.data;

  expect(balanced).toBe(true);
  const difference = equation.assets - (equation.liabilities + equation.equity);
  expect(Math.abs(difference)).toBeLessThan(0.01);
});
```

#### 4. Edge Cases

```typescript
it("should handle empty reports gracefully", async () => {
  // Test with company that has no transactions
});

it("should handle same-day date range", async () => {
  // Test with startDate === endDate
});

it("should handle future dates", async () => {
  // Test with dates in the future
});
```

### Assertions

Use descriptive expect statements:

```typescript
// ✅ GOOD: Specific assertions
expect(response.status).toBe(200);
expect(response.body.success).toBe(true);
expect(response.body.data.assets.total).toBeGreaterThan(0);
expect(Array.isArray(response.body.data.accounts)).toBe(true);

// ❌ BAD: Vague assertions
expect(response).toBeTruthy();
expect(response.body).toBeDefined();
```

### Common Matchers

```typescript
// Equality
expect(value).toBe(expected); // Strict equality (===)
expect(value).toEqual(expected); // Deep equality for objects

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeLessThan(5);
expect(number).toBeCloseTo(0.3, 2); // Floating point comparison

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain("substring");

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array.length).toBeGreaterThan(0);

// Objects
expect(object).toHaveProperty("key");
expect(object).toHaveProperty("key", "value");
```

---

## Common Patterns

### Testing API Endpoints

```typescript
describe("POST /api/v1/endpoint", () => {
  it("should create resource successfully", async () => {
    const response = await request(app)
      .post("/api/v1/endpoint")
      .send({ data: "value" })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});

describe("GET /api/v1/endpoint", () => {
  it("should retrieve resource", async () => {
    const response = await request(app)
      .get("/api/v1/endpoint")
      .query({ companyId: testCompanyId.toString() });

    expect(response.status).toBe(200);
  });
});
```

### Testing Database Operations

```typescript
it("should create journal entry when recording payment", async () => {
  const paymentData = {
    /* ... */
  };

  await request(app).post("/api/v1/payments/received").send(paymentData);

  // Verify database state
  const db = mongoClient.db();
  const journalEntries = await db
    .collection("journal_entries")
    .find({ companyId: testCompanyId })
    .toArray();

  expect(journalEntries.length).toBeGreaterThan(0);
});
```

### Testing Authorization

```typescript
it("should require authentication", async () => {
  const response = await request(app).get("/api/v1/protected-endpoint");

  expect(response.status).toBe(401);
});

it("should require companyId", async () => {
  const response = await request(app).get("/api/v1/endpoint").query({}); // Missing companyId

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Unauthorized");
});
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out

```typescript
// Increase timeout for slow tests
it("should handle large dataset", async () => {
  // ...
}, 10000); // 10 second timeout
```

#### 2. Database Connection Errors

```bash
# Ensure MongoDB is running
# Check MONGODB_URI in .env.test

# Use test database, not production!
MONGODB_URI=mongodb://localhost:27017/accounting_test
```

#### 3. Module Import Errors

```typescript
// ✅ GOOD: Use .js extension for ESM imports
import configureApp from "../../../config/app.js";

// ❌ BAD: Missing .js extension
import configureApp from "../../../config/app";
```

#### 4. Test Data Collisions

```typescript
// ✅ GOOD: Use unique identifiers
const email = `test-${Date.now()}@example.com`;
const slug = `test-company-${Date.now()}`;

// ❌ BAD: Reusing same values
const email = "test@example.com";
```

#### 5. Floating Point Precision

```typescript
// ✅ GOOD: Use toBeCloseTo for decimals
expect(0.1 + 0.2).toBeCloseTo(0.3, 10);

// ❌ BAD: Direct equality check
expect(0.1 + 0.2).toBe(0.3); // May fail
```

### Debugging Tests

```typescript
// Add console.log for debugging (remove before committing)
it("should work", async () => {
  const response = await request(app).get("/endpoint");
  console.log("Response:", response.body);
  expect(response.status).toBe(200);
});

// Use debugger with Node inspector
it("should work", async () => {
  debugger; // Will pause here when running with --inspect
  const response = await request(app).get("/endpoint");
  expect(response.status).toBe(200);
});
```

Run with debugger:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## Test Coverage Goals

- **Minimum coverage**: 70% overall
- **Critical modules**: 90%+ coverage (payment, report, ledger)
- **Controllers**: Test all endpoints
- **Services**: Test all business logic functions
- **Models**: Test validation logic

Check coverage:

```bash
npm run test:coverage
```

---

## Continuous Integration

Tests should:

1. Run on every commit (via pre-commit hook)
2. Pass before merging to main branch
3. Use isolated test database
4. Clean up all test data
5. Complete within 5 minutes

---

## Examples

For working examples, see:

- `apps/backend/src/api/v1/__tests__/auth.test.ts` - Basic authentication testing
- `apps/backend/src/api/v1/modules/payment/__tests__/payment.test.ts` - Payment module testing
- `apps/backend/src/api/v1/modules/report/__tests__/report.test.ts` - Report module testing

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server) - For isolated testing

---

**Last Updated**: February 7, 2026
