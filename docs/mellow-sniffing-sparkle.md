# Accounting Software MVP Implementation Plan

**Target Deadline:** Early 3rd week of February 2026 (Feb 7 → Feb 21)
**Current Status:** ~70% Complete
**Strategy:** Fix Critical Bugs First → Add Missing Features → Polish & Test

---

## Executive Summary

### What's Working ✅

- Core accounting features: Invoices, Bills, Payments, Inventory, Journal Entries, General Ledger
- Double-entry bookkeeping system operational
- Frontend UI complete with 46+ pages
- BetterAuth integration for company/user management

### Critical Issues Found 🔴

1. **Payment Module Bugs:** Missing `/payments/made` endpoint, causing 404 errors
2. **Security Vulnerabilities:** Weak default JWT secrets in production config
3. **Missing Report Backend:** All 4 financial reports have no backend API (frontend shows sample data)
4. **Code Quality:** 50+ console.log statements, heavy use of `any` types

### Timeline (14 Days)

- **Days 1-3 (Feb 7-9):** Critical bug fixes
- **Days 4-10 (Feb 10-16):** Financial report generation backend
- **Days 11-14 (Feb 17-21):** Testing, error handling, deployment prep

---

## Phase 1: Critical Bug Fixes (Days 1-3)

**Priority:** BLOCKER - Must fix before adding features

### 1.1 Fix Payment Module Missing Endpoints

**Problem:** Frontend calls `/api/v1/payments/made` but backend doesn't implement it

**Files to Modify:**

- `apps/backend/src/api/v1/modules/payment/paymentRoutes.ts`
- `apps/backend/src/api/v1/modules/payment/paymentController.ts`

**Implementation:**

```typescript
// paymentRoutes.ts - Add after line 20:
paymentRoutes.post("/made", recordPaymentMade);
paymentRoutes.get("/made", getPaymentsMade);

// paymentController.ts - Add new functions:
export const recordPaymentMade = async (req, res, next) => {
  try {
    const companyId = (req as any).authSession?.session?.activeOrganizationId;
    const userId = (req as any).authSession?.user?.id;
    const paymentData = req.body;

    if (!companyId || !userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payment = await paymentService.recordPaymentMade(
      companyId,
      userId,
      paymentData,
    );

    res.status(201).json({
      message: "Payment made recorded successfully",
      payment,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "recordPaymentMade" });
    next(error);
  }
};

export const getPaymentsMade = async (req, res, next) => {
  try {
    const companyId = (req as any).authSession?.session?.activeOrganizationId;

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payments = await paymentService.getPaymentsMade(companyId);

    res.status(200).json({
      message: "Payments made fetched successfully",
      payments,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "getPaymentsMade" });
    next(error);
  }
};
```

**Testing:**

- Test `POST /api/v1/payments/made` with bill allocation
- Test `GET /api/v1/payments/made` retrieval
- Verify journal entries created correctly

**Estimated Time:** 2-3 hours

---

### 1.2 Fix Security Vulnerabilities

**Problem:** Weak default secrets in production, no environment validation

**Files to Modify:**

- `apps/backend/src/api/v1/config/index.ts` (Lines 21, 36)
- `apps/backend/src/api/v1/config/env.ts` (create validation)
- `.env.example` (add security warnings)

**Implementation:**

```typescript
// config/index.ts - Replace lines 21 and 36:
jwtSecret: (() => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET is required in production');
  }
  return process.env.JWT_SECRET || 'dev-jwt-secret-CHANGE-IN-PRODUCTION';
})(),

betterAuthSecret: (() => {
  if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
    throw new Error('CRITICAL: BETTER_AUTH_SECRET is required in production');
  }
  if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters');
  }
  return process.env.BETTER_AUTH_SECRET || 'dev-better-auth-secret-min-32-chars';
})(),
```

**Create new file: config/env.ts**

```typescript
// Validate critical environment variables on startup
function validateEnv() {
  const required = ["MONGODB_URI"];

  if (process.env.NODE_ENV === "production") {
    required.push("JWT_SECRET", "BETTER_AUTH_SECRET", "FRONTEND_URL");
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

validateEnv();
export {};
```

**Update .env.example:**

```bash
# SECURITY WARNING: In production, use strong random secrets (min 32 characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-random
BETTER_AUTH_SECRET=your-better-auth-secret-min-32-chars-random
```

**Estimated Time:** 2-3 hours

---

### 1.3 Remove Console.log Statements

**Problem:** 7+ production console.log statements should use Winston logger

**Files to Modify:**

- `apps/backend/src/api/v1/scripts/seedAccounts.ts` (3 instances)
- `apps/backend/src/api/v1/scripts/seedSuppliers.ts` (3 instances)
- `apps/backend/src/api/v1/modules/inventory/inventoryController.ts:20`
- `apps/backend/src/api/v1/modules/customer/customerController.ts:19`

**Pattern:**

```typescript
// BEFORE:
console.log("Connected to MongoDB");
console.log("Fetched companyId:", companyId);

// AFTER:
logger.info("Connected to MongoDB");
logger.debug("Fetched companyId", { companyId });
```

**Estimated Time:** 1 hour

---

## Phase 2: Financial Report Generation (Days 4-10)

**Priority:** HIGH - MVP requirement

### 2.1 Create Report Module Structure

**New Files to Create:**

```
apps/backend/src/api/v1/modules/report/
├── reportRoutes.ts
├── reportController.ts
├── reportService.ts
└── types.ts (optional - report interfaces)
```

**File: reportRoutes.ts**

```typescript
import { Router } from "express";
import {
  generateBalanceSheet,
  generateIncomeStatement,
  generateCashFlowStatement,
  generateTrialBalance,
} from "./reportController.js";

export const reportRoutes = Router();

// Financial reports
reportRoutes.get("/balance-sheet", generateBalanceSheet);
reportRoutes.get("/income-statement", generateIncomeStatement);
reportRoutes.get("/cash-flow", generateCashFlowStatement);
reportRoutes.get("/trial-balance", generateTrialBalance);

export default reportRoutes;
```

**Register in `apps/backend/src/api/v1/routes/index.ts` (after line 61):**

```typescript
import { reportRoutes } from "../modules/report/reportRoutes.js";

// Add after ledger routes:
app.use(`${API_PREFIX}/reports`, reportRoutes);
```

**Estimated Time:** 2 hours

---

### 2.2 Implement Balance Sheet Service

**File: reportService.ts**

```typescript
import Account from "../../models/Account.js";
import { ledgerService } from "../ledger/ledgerService.js";

export const reportService = {
  /**
   * Generate Balance Sheet
   * Shows: Assets, Liabilities, Equity at a specific date
   * Formula: Assets = Liabilities + Equity
   */
  async generateBalanceSheet(companyId: string, asOfDate: Date = new Date()) {
    // 1. Get all accounts grouped by type
    const accounts = await Account.find({ companyId }).lean();

    // 2. For each account, get balance from Ledger
    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => {
        const balance = await ledgerService.getAccountBalance(
          account._id.toString(),
          asOfDate,
        );
        return { ...account, balance };
      }),
    );

    // 3. Group by account type and subtype
    const assets = accountsWithBalances.filter(
      (a) => a.accountType === "Asset",
    );
    const liabilities = accountsWithBalances.filter(
      (a) => a.accountType === "Liability",
    );
    const equity = accountsWithBalances.filter(
      (a) => a.accountType === "Equity",
    );

    // 4. Calculate totals
    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    // 5. Verify accounting equation
    const balanced =
      Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return {
      asOfDate,
      assets: {
        currentAssets: assets.filter((a) => a.subType?.includes("Current")),
        fixedAssets: assets.filter((a) => a.subType?.includes("Fixed")),
        otherAssets: assets.filter(
          (a) =>
            !a.subType?.includes("Current") && !a.subType?.includes("Fixed"),
        ),
        total: totalAssets,
      },
      liabilities: {
        currentLiabilities: liabilities.filter((a) =>
          a.subType?.includes("Current"),
        ),
        longTermLiabilities: liabilities.filter((a) =>
          a.subType?.includes("Long-term"),
        ),
        otherLiabilities: liabilities.filter(
          (a) =>
            !a.subType?.includes("Current") &&
            !a.subType?.includes("Long-term"),
        ),
        total: totalLiabilities,
      },
      equity: {
        accounts: equity,
        total: totalEquity,
      },
      balanced,
      equation: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        equity: totalEquity,
      },
    };
  },
};
```

**Estimated Time:** 4-6 hours

---

### 2.3 Implement Income Statement Service

**Add to reportService.ts:**

```typescript
  /**
   * Generate Income Statement (Profit & Loss)
   * Shows: Revenue - Expenses = Net Income for a period
   */
  async generateIncomeStatement(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    // 1. Get Revenue accounts
    const revenueAccounts = await Account.find({
      companyId,
      accountType: 'Revenue',
    }).lean();

    // 2. Get Expense accounts
    const expenseAccounts = await Account.find({
      companyId,
      accountType: 'Expense',
    }).lean();

    // 3. Calculate revenue total from ledger entries
    const revenueWithAmounts = await Promise.all(
      revenueAccounts.map(async (account) => {
        const entries = await ledgerService.findByAccountAndDateRange(
          account._id.toString(),
          startDate,
          endDate
        );

        // Revenue has credit normal balance
        const total = entries.reduce((sum, entry) => {
          return sum + (parseFloat(entry.credit) - parseFloat(entry.debit));
        }, 0);

        return { ...account, amount: total };
      })
    );

    // 4. Calculate expense total from ledger entries
    const expenseWithAmounts = await Promise.all(
      expenseAccounts.map(async (account) => {
        const entries = await ledgerService.findByAccountAndDateRange(
          account._id.toString(),
          startDate,
          endDate
        );

        // Expense has debit normal balance
        const total = entries.reduce((sum, entry) => {
          return sum + (parseFloat(entry.debit) - parseFloat(entry.credit));
        }, 0);

        return { ...account, amount: total };
      })
    );

    // 5. Calculate totals
    const totalRevenue = revenueWithAmounts.reduce((sum, a) => sum + a.amount, 0);
    const totalExpenses = expenseWithAmounts.reduce((sum, a) => sum + a.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      period: { startDate, endDate },
      revenue: {
        accounts: revenueWithAmounts,
        total: totalRevenue,
      },
      expenses: {
        accounts: expenseWithAmounts,
        total: totalExpenses,
      },
      netIncome,
    };
  },
```

**Estimated Time:** 4-6 hours

---

### 2.4 Implement Cash Flow Statement Service

**Add to reportService.ts:**

```typescript
  /**
   * Generate Cash Flow Statement
   * Shows: Operating, Investing, Financing activities
   */
  async generateCashFlowStatement(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    // 1. Get Net Income from Income Statement
    const incomeStatement = await this.generateIncomeStatement(
      companyId,
      startDate,
      endDate
    );
    const netIncome = incomeStatement.netIncome;

    // 2. Operating Activities - Get changes in AR, AP, Inventory
    const operatingAccounts = await Account.find({
      companyId,
      accountCode: { $in: ['1200', '2100', '1300'] }, // AR, AP, Inventory
    }).lean();

    const operatingChanges = await Promise.all(
      operatingAccounts.map(async (account) => {
        const startBalance = await ledgerService.getAccountBalance(
          account._id.toString(),
          startDate
        );
        const endBalance = await ledgerService.getAccountBalance(
          account._id.toString(),
          endDate
        );

        return {
          accountName: account.accountName,
          change: endBalance - startBalance,
        };
      })
    );

    // 3. Investing Activities - Get capital expenditures
    const investingAccounts = await Account.find({
      companyId,
      accountType: 'Asset',
      subType: { $regex: /Fixed|Property|Equipment/i },
    }).lean();

    const investingChanges = await Promise.all(
      investingAccounts.map(async (account) => {
        const entries = await ledgerService.findByAccountAndDateRange(
          account._id.toString(),
          startDate,
          endDate
        );

        const total = entries.reduce((sum, entry) => {
          return sum + (parseFloat(entry.debit) - parseFloat(entry.credit));
        }, 0);

        return {
          accountName: account.accountName,
          amount: total,
        };
      })
    );

    // 4. Financing Activities - Get equity and loan changes
    const financingAccounts = await Account.find({
      companyId,
      $or: [
        { accountType: 'Equity' },
        { accountType: 'Liability', subType: { $regex: /Long-term|Loan/i } },
      ],
    }).lean();

    const financingChanges = await Promise.all(
      financingAccounts.map(async (account) => {
        const entries = await ledgerService.findByAccountAndDateRange(
          account._id.toString(),
          startDate,
          endDate
        );

        const total = entries.reduce((sum, entry) => {
          return sum + (parseFloat(entry.credit) - parseFloat(entry.debit));
        }, 0);

        return {
          accountName: account.accountName,
          amount: total,
        };
      })
    );

    // 5. Calculate net cash flow
    const operatingCashFlow = netIncome + operatingChanges.reduce((sum, c) => sum + c.change, 0);
    const investingCashFlow = investingChanges.reduce((sum, c) => sum - c.amount, 0); // Negative for purchases
    const financingCashFlow = financingChanges.reduce((sum, c) => sum + c.amount, 0);
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    return {
      period: { startDate, endDate },
      operatingActivities: {
        netIncome,
        adjustments: operatingChanges,
        total: operatingCashFlow,
      },
      investingActivities: {
        items: investingChanges,
        total: investingCashFlow,
      },
      financingActivities: {
        items: financingChanges,
        total: financingCashFlow,
      },
      netCashFlow,
    };
  },
```

**Estimated Time:** 6-8 hours

---

### 2.5 Implement Trial Balance (Leverage Existing)

**Add to reportService.ts:**

```typescript
  /**
   * Generate Trial Balance
   * Reuse existing ledgerService method
   */
  async generateTrialBalance(companyId: string, asOfDate?: Date) {
    return await ledgerService.getTrialBalance(companyId, asOfDate);
  },
```

**Estimated Time:** 1 hour

---

### 2.6 Implement Report Controllers

**File: reportController.ts**

```typescript
import { reportService } from "./reportService.js";
import logger from "../../config/logger.js";
import { Request, Response, NextFunction } from "express";

export const generateBalanceSheet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = (req as any).authSession?.session?.activeOrganizationId;
    const asOfDate = req.query.asOfDate
      ? new Date(req.query.asOfDate as string)
      : new Date();

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const balanceSheet = await reportService.generateBalanceSheet(
      companyId,
      asOfDate,
    );

    res.status(200).json({
      success: true,
      data: balanceSheet,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateBalanceSheet" });
    next(error);
  }
};

export const generateIncomeStatement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = (req as any).authSession?.session?.activeOrganizationId;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const incomeStatement = await reportService.generateIncomeStatement(
      companyId,
      startDate,
      endDate,
    );

    res.status(200).json({
      success: true,
      data: incomeStatement,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateIncomeStatement" });
    next(error);
  }
};

export const generateCashFlowStatement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = (req as any).authSession?.session?.activeOrganizationId;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cashFlow = await reportService.generateCashFlowStatement(
      companyId,
      startDate,
      endDate,
    );

    res.status(200).json({
      success: true,
      data: cashFlow,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateCashFlowStatement" });
    next(error);
  }
};

export const generateTrialBalance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = (req as any).authSession?.session?.activeOrganizationId;
    const asOfDate = req.query.asOfDate
      ? new Date(req.query.asOfDate as string)
      : undefined;

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const trialBalance = await reportService.generateTrialBalance(
      companyId,
      asOfDate,
    );

    res.status(200).json({
      success: true,
      data: trialBalance,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateTrialBalance" });
    next(error);
  }
};
```

**Estimated Time:** 4 hours

---

### 2.7 Update Frontend Report Pages

**Files to Modify:**

- `apps/frontend/app/(protected)/reports/balance-sheet/page.tsx`
- `apps/frontend/app/(protected)/reports/profit-loss/page.tsx`
- `apps/frontend/app/(protected)/reports/cash-flow/page.tsx`

**Pattern (Balance Sheet example):**

```typescript
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/config/api-client";

interface BalanceSheetData {
  asOfDate: string;
  assets: {
    currentAssets: any[];
    fixedAssets: any[];
    total: number;
  };
  liabilities: {
    currentLiabilities: any[];
    longTermLiabilities: any[];
    total: number;
  };
  equity: {
    accounts: any[];
    total: number;
  };
  balanced: boolean;
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalanceSheet() {
      try {
        const result = await apiFetch<{ success: boolean; data: BalanceSheetData }>(
          "/reports/balance-sheet"
        );
        setData(result.data);
      } catch (err) {
        setError("Failed to load balance sheet");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBalanceSheet();
  }, []);

  if (loading) return <div>Loading balance sheet...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      <h1>Balance Sheet</h1>
      <p>As of: {new Date(data.asOfDate).toLocaleDateString()}</p>

      {/* Replace hardcoded values with data.assets.total, etc. */}
      <div>
        <h2>Assets</h2>
        <p>Total: {formatCurrency(data.assets.total)}</p>

        <h2>Liabilities</h2>
        <p>Total: {formatCurrency(data.liabilities.total)}</p>

        <h2>Equity</h2>
        <p>Total: {formatCurrency(data.equity.total)}</p>

        {!data.balanced && (
          <div className="text-red-500">
            Warning: Balance sheet is not balanced!
          </div>
        )}
      </div>
    </div>
  );
}
```

**Repeat similar pattern for:**

- Profit & Loss (Income Statement)
- Cash Flow Statement

**Estimated Time:** 6-8 hours

---

## Phase 3: Testing & Polish (Days 11-14)

**Priority:** MEDIUM - Quality assurance

### 3.1 End-to-End Testing

**Test Scenarios:**

1. **Invoice → Payment → Reports**
   - Create invoice for customer
   - Record payment received
   - Verify journal entries created
   - Check Balance Sheet shows increased cash, decreased AR
   - Check Income Statement shows revenue

2. **Bill → Payment → Reports**
   - Create bill from supplier
   - Record payment made
   - Verify journal entries created
   - Check Balance Sheet shows decreased cash, decreased AP
   - Check Income Statement shows expense

3. **Report Accuracy**
   - Generate Balance Sheet → Verify: Assets = Liabilities + Equity
   - Generate Trial Balance → Verify: Total Debits = Total Credits
   - Generate Income Statement → Verify: Net Income matches expectations
   - Generate Cash Flow → Verify: Net Cash Flow is reasonable

4. **Edge Cases**
   - Empty reports (no transactions)
   - Single-day date range (startDate = endDate)
   - Future dates
   - Past fiscal year dates

**Tools:**

- Manual testing via frontend UI
- Postman/Thunder Client for API testing
- Database verification (MongoDB Compass)

**Estimated Time:** 8-12 hours

---

### 3.2 Error Handling & User Messages

**Add validation and friendly error messages:**

**Backend - Create custom error classes:**

```typescript
// apps/backend/src/api/v1/shared/errors/CustomErrors.ts
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BusinessLogicError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "BusinessLogicError";
  }
}
```

**Update error middleware in `apps/backend/src/api/v1/config/app.ts`:**

```typescript
import {
  ValidationError,
  NotFoundError,
  BusinessLogicError,
} from "../shared/errors/CustomErrors.js";

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
      field: err.field,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: "Not Found",
      message: err.message,
    });
  }

  if (err instanceof BusinessLogicError) {
    return res.status(422).json({
      error: "Business Logic Error",
      message: err.message,
      code: err.code,
    });
  }

  // Generic error
  logger.logError(err, { path: req.path });
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "An error occurred. Please try again."
        : err.message,
  });
});
```

**Common error scenarios to handle:**

- No data for selected period: "No transactions found for the selected date range"
- Chart of accounts not set up: "Please set up your chart of accounts first"
- Unbalanced journal entry: "Transaction is not balanced (debits ≠ credits)"
- Payment exceeds invoice: "Payment amount exceeds invoice balance"

**Estimated Time:** 4-6 hours

---

### 3.3 Documentation & Deployment Prep

**Tasks:**

1. **Update README.md** with:
   - Installation instructions
   - Environment variables required
   - How to run locally
   - API endpoints overview

2. **Create API_ENDPOINTS.md** documenting:

   ```markdown
   # Financial Reports API

   ## GET /api/v1/reports/balance-sheet

   Generate balance sheet as of a specific date

   Query Parameters:

   - asOfDate (optional): ISO date string, defaults to today

   Response:
   {
   "success": true,
   "data": {
   "asOfDate": "2026-02-21",
   "assets": { ... },
   "liabilities": { ... },
   "equity": { ... },
   "balanced": true
   }
   }
   ```

3. **Environment Variables Checklist:**
   - MongoDB URI
   - JWT Secret (production)
   - Better Auth Secret (production)
   - Frontend URL
   - Email credentials (if applicable)

4. **Deployment Checklist:**
   - [ ] All tests passing
   - [ ] Environment variables set in production
   - [ ] Database indexed properly
   - [ ] CORS configured for production domain
   - [ ] Error logging configured
   - [ ] SSL/HTTPS enabled

**Estimated Time:** 4-6 hours

---

## Critical Files Reference

### Backend Files to Modify

1. `apps/backend/src/api/v1/modules/payment/paymentRoutes.ts` - Add /made endpoints
2. `apps/backend/src/api/v1/modules/payment/paymentController.ts` - Add controllers
3. `apps/backend/src/api/v1/config/index.ts` - Fix security
4. `apps/backend/src/api/v1/config/env.ts` - Add validation (NEW)
5. `apps/backend/src/api/v1/modules/report/reportService.ts` - Report logic (NEW)
6. `apps/backend/src/api/v1/modules/report/reportController.ts` - Report controllers (NEW)
7. `apps/backend/src/api/v1/modules/report/reportRoutes.ts` - Report routes (NEW)
8. `apps/backend/src/api/v1/routes/index.ts` - Register report routes
9. Console.log cleanup in: seedAccounts.ts, seedSuppliers.ts, inventoryController.ts, customerController.ts

### Frontend Files to Modify

1. `apps/frontend/app/(protected)/reports/balance-sheet/page.tsx` - Connect to API
2. `apps/frontend/app/(protected)/reports/profit-loss/page.tsx` - Connect to API
3. `apps/frontend/app/(protected)/reports/cash-flow/page.tsx` - Connect to API

---

## Verification Checklist

### Phase 1 Complete ✓

- [ ] `POST /api/v1/payments/made` returns 201 with payment object
- [ ] `GET /api/v1/payments/made` returns array of payments
- [ ] Production throws error if JWT_SECRET missing
- [ ] Production throws error if BETTER_AUTH_SECRET missing
- [ ] No console.log statements in backend code
- [ ] Winston logger used for all logging

### Phase 2 Complete ✓

- [ ] `GET /api/v1/reports/balance-sheet` returns valid data
- [ ] Balance Sheet: Assets = Liabilities + Equity (balanced: true)
- [ ] `GET /api/v1/reports/income-statement` returns valid data
- [ ] Income Statement: Net Income calculated correctly
- [ ] `GET /api/v1/reports/cash-flow` returns valid data
- [ ] Cash Flow: All three sections populated
- [ ] `GET /api/v1/reports/trial-balance` returns valid data
- [ ] Trial Balance: Total Debits = Total Credits
- [ ] Frontend Balance Sheet shows real data (no hardcoded values)
- [ ] Frontend P&L shows real data
- [ ] Frontend Cash Flow shows real data

### Phase 3 Complete ✓

- [ ] Create invoice → payment → reports workflow tested
- [ ] Create bill → payment → reports workflow tested
- [ ] Error messages are user-friendly
- [ ] API documentation complete
- [ ] Deployment checklist complete
- [ ] README.md updated

---

## Deferred Features (Post-MVP)

These can be implemented after the initial launch:

1. **Recurring Transactions** - Frontend exists, backend incomplete
2. **Audit Log Viewing UI** - Model exists, no viewing interface
3. **Backup/Restore UI** - Model exists, no UI
4. **Advanced Tax Reports** - Beyond basic VAT tracking
5. **PDF Export for Reports** - Can add later
6. **Report Caching** - Performance optimization
7. **Multi-currency Support** - Field exists but no conversion logic
8. **Chart customization** - Dashboard charts currently use sample data

---

## Risk Mitigation

### High-Risk Areas

1. **Report Calculation Accuracy**
   - **Risk:** Wrong calculations in financial reports
   - **Mitigation:** Use existing tested ledgerService, verify with manual calculations
   - **Testing:** Compare against spreadsheet calculations

2. **Date Range Edge Cases**
   - **Risk:** Incorrect filtering (off-by-one errors)
   - **Mitigation:** Use inclusive queries ($gte startDate, $lte endDate)
   - **Testing:** Test same-day ranges, month-end, year-end

3. **Performance with Large Data**
   - **Risk:** Slow reports with thousands of transactions
   - **Mitigation:** Use MongoDB aggregation pipelines, ensure indexes exist
   - **Monitoring:** Add timing logs to identify slow queries

### Dependencies

- **BetterAuth** - Already integrated and working ✓
- **MongoDB** - Connection stable ✓
- **Winston Logger** - Already in use ✓
- **Ledger Service** - Already exists and tested ✓

---

## Timeline Summary

| Phase              | Days              | Key Deliverables                                |
| ------------------ | ----------------- | ----------------------------------------------- |
| Phase 1: Bug Fixes | 1-3 (Feb 7-9)     | Payment endpoints, security fixes, code cleanup |
| Phase 2: Reports   | 4-10 (Feb 10-16)  | All 4 financial reports working end-to-end      |
| Phase 3: Polish    | 11-14 (Feb 17-21) | Testing, error handling, documentation          |

**Total:** 14 days (~98 working hours)
**Buffer:** 2 days built into estimates for unexpected issues
**Target Launch:** February 21, 2026

---

## Notes

1. **Start with Phase 1** - Don't proceed until all critical bugs are fixed
2. **Test incrementally** - Test each report as it's built
3. **Leverage existing code** - Trial balance and ledger service already work
4. **Keep it simple** - MVP doesn't need PDF export, caching, or advanced features
5. **Security first** - Validate environment variables before any development work
6. **Monitor performance** - If reports are slow, add indexes or pagination

---

## Success Criteria

**MVP is ready when:**

- ✅ All payment functionality works (received + made)
- ✅ No security vulnerabilities (strong secrets enforced)
- ✅ All 4 financial reports generate correctly from real data
- ✅ Accounting equation verified: Assets = Liabilities + Equity
- ✅ Trial balance balanced: Debits = Credits
- ✅ User-friendly error messages
- ✅ Zero console.log in production code
- ✅ Documentation complete for deployment

**Quality gates:**

- Manual testing of all core workflows passes
- Balance sheet equation verified with real transactions
- Trial balance is balanced with real transactions
- No critical TypeScript errors
- Environment validation works
