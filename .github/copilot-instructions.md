# GitHub Copilot Instructions — Accounting Software Monorepo

## Scope Boundary

**All suggestions must be grounded in this monorepo.** Before generating any code:

- **Routes**: verify against `apps/backend/src/api/v1/routes/index.ts`
- **Validators**: verify/use from `packages/validators/src/` — never define Zod schemas inline in a module
- **UI components**: verify/use from `packages/ui/components/` or `apps/frontend/components/ui/` — never recreate
- **Env variables**: verify against `apps/backend/src/api/v1/config/env.ts`
- **RBAC enums**: use `Resource`, `Action`, `OrgRole` from `@sas/validators` — never hardcode strings
- **Dependencies**: never suggest installing a package not already in the relevant `package.json`
- **When uncertain about a file, function, or type**: search the workspace first, read the file, then answer
- **Do not invent** file paths, function names, model fields, or API shapes — inspect them

---

## Monorepo Structure

```
apps/
  backend/      → REST API (Express 5 + MongoDB/Mongoose + Better Auth) — package name: api
  frontend/     → Main accounting app (Next.js 16 + React 19)          — package name: frontend
  admin/        → Admin dashboard (Next.js 16)
  site/         → Marketing site (Astro 5)
packages/
  validators/   → Shared Zod schemas + RBAC enums                      — package name: @sas/validators
  ui/           → Shared shadcn/ui component library                    — package name: @sas/ui
  config-eslint/→ Shared ESLint configs
```

**pnpm workspace scripts (run from root):**

| Script                             | Purpose                       |
| ---------------------------------- | ----------------------------- |
| `pnpm dev`                         | Run all apps in parallel      |
| `pnpm dev:api`                     | Backend only                  |
| `pnpm dev:app`                     | Frontend only                 |
| `pnpm --filter api test`           | Run backend tests             |
| `pnpm --filter api test:watch`     | Backend tests in watch mode   |
| `pnpm --filter api test:coverage`  | Coverage report               |
| `pnpm build:validators`            | Build `@sas/validators`       |
| `pnpm --filter api seed:accounts`  | Seed chart of accounts        |
| `pnpm --filter api seed:suppliers` | Seed suppliers                |
| `pnpm typecheck`                   | TypeScript check all packages |

---

## Backend Architecture

### Module Pattern (canonical template: `apps/backend/src/api/v1/modules/invoice/`)

Every domain module follows: **Routes → Controller → Service → Model**

```
modules/{name}/
  {name}Routes.ts      → Express router, applies requireAuth + requirePermission per route
  {name}Controller.ts  → HTTP handler: extract companyId/userId, call service, return JSON
  {name}Service.ts     → Business logic: Mongoose queries, transactions, throw on error
```

Models live in `apps/backend/src/api/v1/models/` (not inside the module folder).

### Multi-Tenancy Rule

**Every query must be scoped by `companyId`.** Never query a collection without it.

```ts
// Extract from session on every controller action:
const companyId = getCompanyId(req); // from apps/backend/src/api/v1/shared/helpers/utils.ts
if (!companyId)
  return res.status(401).json({ success: false, error: "Unauthorized" });
```

### Auth & RBAC Middleware

```ts
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

router.use(requireAuth); // apply to all routes in the file
router.get(
  "/",
  requirePermission(Resource.invoice, Action.read),
  controller.getAll,
);
router.post(
  "/",
  requirePermission(Resource.invoice, Action.create),
  controller.create,
);
router.put(
  "/:id",
  requirePermission(Resource.invoice, Action.update),
  controller.update,
);
router.delete(
  "/:id",
  requirePermission(Resource.invoice, Action.delete),
  controller.delete,
);
```

**`Resource` enum values** (from `@sas/validators`):
`accounts`, `journalEntry`, `invoice`, `bill`, `payment`, `customer`, `supplier`, `inventory`, `report`, `ledger`, `companySetting`, `user`, `period`, `role`

**`Action` enum values**: `read`, `create`, `update`, `delete`

**`OrgRole` enum values**: `owner`, `admin`, `accountant`, `staff`, `viewer`

### Standard JSON Response Shape

```ts
// Success
res.status(200).json({ success: true, data: result, count?: number });

// Error
res.status(4xx|500).json({ success: false, error: "message" });
```

### Logging

```ts
import logger from "../../config/logger.js";

logger.info("message", { context });
logger.logError(error as Error, { operation: "operationName", ...context });
```

Never use `console.log` — always use the `logger` instance.

### Error Handling

Throw errors from the service layer; let the global error handler catch them. Use the custom error classes in `apps/backend/src/api/v1/shared/error-types/`:

- `AuthenticationError` — 401
- `AuthorizationError` — 403
- `ValidationError` — 422

### Validators

All Zod schemas come from `@sas/validators`. Import and use them in controllers/services:

```ts
import { billSchema } from "@sas/validators";
const parsed = billSchema.parse(req.body);
```

### Registration

After creating a new module's routes file, register it in `apps/backend/src/api/v1/routes/index.ts`:

```ts
import newModuleRoutes from "../modules/{name}/{name}Routes.js";
app.use(`${API_PREFIX}/{plural-name}`, newModuleRoutes);
```

---

## Frontend Architecture

### Service → Hook → Page Pattern

```
lib/services/{name}.service.ts  → apiFetch wrappers, TypeScript interfaces
hooks/use-{name}.ts             → useState + useCallback, calls service, returns state
app/(protected)/{name}/page.tsx → Page component consuming the hook
```

Canonical template: `hooks/use-invoices.ts` + `lib/services/invoice.service.ts`

### API Client

All HTTP calls go through `apiFetch` from `@/lib/config/api-client`:

```ts
import { apiFetch } from "@/lib/config/api-client";

// GET
const result = await apiFetch<{ success: boolean; data: Invoice[] }>(
  "/invoices",
);

// POST
const result = await apiFetch<{ success: boolean; data: Invoice }>(
  "/invoices",
  {
    method: "POST",
    body: JSON.stringify(payload),
  },
);
```

Never use `fetch` directly. Never hardcode API URLs.

### Auth Context

```ts
import { useAuth } from "@/lib/contexts/auth-context";
const { user, session, isLoading } = useAuth();
```

### Active Organization (company ID on frontend)

```ts
import { authClient } from "@/lib/config/auth-client";
const { data: activeOrg } = authClient.useActiveOrganization();
const companyId = activeOrg?.id;
```

### Permission Guard

Wrap any UI that requires a specific permission:

```tsx
import { PermissionGuard } from "@/lib/auth/permission-guard";
import type { Resource, Action } from "@sas/validators";

<PermissionGuard resource={Resource.invoice} action={Action.create}>
  <CreateInvoiceButton />
</PermissionGuard>;
```

### Toast Notifications (Sonner)

```ts
import { toast } from "sonner";

toast.success("Invoice created");
toast.error("Failed to create invoice");
```

### UI Components

Always import from `@/components/ui/{component}` (re-exported from `@sas/ui`). Never define base UI components inline. Check `packages/ui/components/` for the full list before asking what's available.

### Route Location

All authenticated pages go under `apps/frontend/app/(protected)/`. The layout at `app/(protected)/layout.tsx` handles auth enforcement.

---

## Shared Package: `@sas/validators`

Source: `packages/validators/src/`

Exports:

- `accountSchema`, `billSchema`, `customerSchema`, `supplierSchema`, `inventoryItemSchema`, `userSchema`, `subscriptionActivationSchema`
- `Resource` enum, `Action` enum, `OrgRole` enum
- `DEFAULT_ROLE_PERMISSIONS` (permission matrix)

Use `@sas/validators` on both backend and frontend for the same validation schemas. Do not duplicate schemas.

---

## Shared Package: `@sas/ui`

Source: `packages/ui/components/`

54+ shadcn/ui components: Button, Card, Dialog, Form, Input, Select, Table, Tabs, Badge, Skeleton, Spinner, Tooltip, Sonner, Sidebar, Chart, DataTable, etc.

Import in frontend via `@/components/ui/{component}` (aliased to the shared package).

---

## Database Models

Source: `apps/backend/src/api/v1/models/`

All documents include `companyId` for multi-tenant isolation.

| Model                  | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `Account`              | Chart of accounts (Asset/Liability/Equity/Revenue/Expense) |
| `Invoice`              | Customer invoices with line items                          |
| `Bill`                 | Supplier bills                                             |
| `Payment`              | Payments received/made                                     |
| `JournalEntry`         | Double-entry bookkeeping journal entries                   |
| `Ledger`               | General ledger                                             |
| `Customer`             | Customer profiles                                          |
| `Supplier`             | Supplier profiles                                          |
| `InventoryItem`        | Inventory items                                            |
| `InventoryTransaction` | Stock movements                                            |
| `CompanySettings`      | Company configuration                                      |
| `Role`                 | RBAC roles per company                                     |
| `MemberPermission`     | Per-user resource permissions                              |
| `AccountingPeriod`     | Fiscal periods                                             |
| `Report`               | Generated financial reports                                |
| `AuditLog`             | Audit trail                                                |
| `Subscription`         | Subscription records                                       |

---

## Testing (Backend)

Framework: Vitest 4 + Supertest. Tests live in `apps/backend/src/api/v1/__tests__/` and per-module `__tests__/` folders.

Pattern:

```ts
beforeAll(() => {
  /* setup test MongoDB, create test user + company */
});
afterAll(() => {
  /* clean up collections */
});

it("should ...", async () => {
  const res = await request(app).get("/api/v1/...").expect(200);
  expect(res.body.success).toBe(true);
});
```

Run: `pnpm --filter api test`

---

## Key File Reference

| What               | Where                                                          |
| ------------------ | -------------------------------------------------------------- |
| Route registration | `apps/backend/src/api/v1/routes/index.ts`                      |
| Auth middleware    | `apps/backend/src/api/v1/shared/middleware/auth.middleware.ts` |
| companyId helper   | `apps/backend/src/api/v1/shared/helpers/utils.ts`              |
| Env variables      | `apps/backend/src/api/v1/config/env.ts`                        |
| DB connection      | `apps/backend/src/api/v1/config/db.ts`                         |
| Logger             | `apps/backend/src/api/v1/config/logger.ts`                     |
| Better Auth config | `apps/backend/src/api/v1/modules/auth/betterAuth.ts`           |
| RBAC enums         | `packages/validators/src/permissions.ts`                       |
| Validators index   | `packages/validators/src/index.ts`                             |
| API client         | `apps/frontend/lib/config/api-client.ts`                       |
| Auth client        | `apps/frontend/lib/config/auth-client.ts`                      |
| Auth context       | `apps/frontend/lib/contexts/auth-context.tsx`                  |
| Permission guard   | `apps/frontend/lib/auth/permission-guard.tsx`                  |
| Frontend services  | `apps/frontend/lib/services/`                                  |
| Frontend hooks     | `apps/frontend/hooks/`                                         |
| UI components      | `packages/ui/components/`                                      |
