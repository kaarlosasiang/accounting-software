# Report Authentication Fix

**Date:** February 7, 2026
**Issue:** Unauthorized errors when accessing Balance Sheet and Cash Flow reports
**Status:** ✅ **FIXED**

---

## Problem

When testing the financial reports (Balance Sheet, Cash Flow, Income Statement, Trial Balance), users were receiving **401 Unauthorized** errors.

### Root Cause

The report routes were missing authentication middleware, causing two issues:

1. **No Auth Middleware:** Report routes didn't have `requireAuth` middleware applied
2. **Incorrect CompanyId Retrieval:** Controllers were trying to access `(req as any).user?.companyId` which was never populated

---

## Solution

### 1. Added Authentication Middleware

**File:** `apps/backend/src/api/v1/modules/report/reportRoutes.ts`

**Change:**

```typescript
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

export const reportRoutes = Router();

// Apply auth middleware to all routes
reportRoutes.use(requireAuth);
```

This ensures:

- All report endpoints require valid authentication
- `req.authSession` and `req.authUser` are populated
- Unauthenticated requests return 401 automatically

---

### 2. Fixed Company ID Retrieval

**File:** `apps/backend/src/api/v1/modules/report/reportController.ts`

**Before:**

```typescript
const companyId =
  (req.query.companyId as string) || (req as any).user?.companyId;
```

**After:**

```typescript
import { getCompanyId } from "../../shared/helpers/utils.js";

const companyId = getCompanyId(req);
```

**Updated in all 4 functions:**

- `generateBalanceSheet`
- `generateIncomeStatement`
- `generateCashFlowStatement`
- `generateTrialBalance`

---

## How getCompanyId Works

The `getCompanyId` helper checks multiple sources in order of preference:

1. **`authSession.session.activeOrganizationId`** ← Preferred (from better-auth organization plugin)
2. **`authSession.activeOrganization.id`**
3. **`authUser.organizationId`** (legacy)
4. **`authUser.companyId`** (backwards compatibility)

This ensures compatibility with the better-auth organization system.

---

## Testing

### Before Fix

```bash
GET /api/v1/reports/balance-sheet
Status: 401 Unauthorized
Response: { "message": "Unauthorized" }
```

### After Fix

```bash
GET /api/v1/reports/balance-sheet
Status: 200 OK
Response: {
  "success": true,
  "data": {
    "asOfDate": "2026-02-07",
    "assets": { ... },
    "liabilities": { ... },
    "equity": { ... }
  }
}
```

---

## Files Modified

1. **`apps/backend/src/api/v1/modules/report/reportRoutes.ts`**
   - Added `requireAuth` middleware import
   - Applied middleware to all routes

2. **`apps/backend/src/api/v1/modules/report/reportController.ts`**
   - Imported `getCompanyId` helper
   - Updated all 4 controller functions to use helper

---

## Verification

✅ **TypeScript Compilation:** 0 errors
✅ **Authentication:** All routes require valid session
✅ **Company ID Resolution:** Uses proper multi-source lookup
✅ **Consistent with Other Modules:** Matches invoice/bill/payment patterns

---

## Related Code Patterns

Other modules using the same authentication pattern:

- **Invoice Module:** `apps/backend/src/api/v1/modules/invoice/invoiceRoutes.ts`
- **Bill Module:** `apps/backend/src/api/v1/modules/bill/billRoutes.ts`
- **Payment Module:** `apps/backend/src/api/v1/modules/payment/paymentRoutes.ts`
- **Journal Entry Module:** `apps/backend/src/api/v1/modules/journalEntry/journalEntryRoutes.ts`

All use:

```typescript
import { requireAuth } from "../../shared/middleware/auth.middleware.js";
router.use(requireAuth);
```

And:

```typescript
import { getCompanyId, getUserId } from "../../shared/helpers/utils.js";
const companyId = getCompanyId(req);
const userId = getUserId(req);
```

---

## User Impact

**Before:** Users couldn't access any financial reports
**After:** Users can now view all 4 reports when authenticated

**Reports Fixed:**

- ✅ Balance Sheet (`/api/v1/reports/balance-sheet`)
- ✅ Income Statement (`/api/v1/reports/income-statement`)
- ✅ Cash Flow Statement (`/api/v1/reports/cash-flow`)
- ✅ Trial Balance (`/api/v1/reports/trial-balance`)

---

## Additional Notes

### Frontend Requirements

The frontend uses `apiFetch` which includes `credentials: "include"` to send authentication cookies:

```typescript
// apps/frontend/lib/config/api-client.ts
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    credentials: "include", // ← Sends session cookies
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  // ...
}
```

No frontend changes were needed - the `apiFetch` function was already configured correctly.

### Authentication Flow

1. User logs in via better-auth
2. Session cookie is set
3. Frontend makes request with `credentials: "include"`
4. Backend `requireAuth` middleware validates session
5. `req.authSession` and `req.authUser` are populated
6. `getCompanyId(req)` extracts company ID from session
7. Report is generated for that company

---

**Status:** ✅ **COMPLETE - Reports are now accessible to authenticated users**
