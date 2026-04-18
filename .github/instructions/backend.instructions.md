---
applyTo: "apps/backend/**"
---

## Backend Rules — Always Active

### Scope Boundary

- Read `apps/backend/src/api/v1/routes/index.ts` before touching any route
- Read `apps/backend/src/api/v1/models/` before referencing any model field
- Read `packages/validators/src/index.ts` before writing any validation — never define Zod schemas inline
- Read `packages/validators/src/permissions.ts` before using any `Resource` or `Action` value
- Never suggest a dependency not already in `apps/backend/package.json`

### Module Pattern (canonical: `modules/invoice/`)

Every module: `{name}Routes.ts` → `{name}Controller.ts` → `{name}Service.ts`
Models live in `apps/backend/src/api/v1/models/` — never inside the module folder.

### Multi-Tenancy — Non-Negotiable

Every Mongoose query **must** be scoped by `companyId`. No exceptions.

```ts
const companyId = getCompanyId(req); // apps/backend/src/api/v1/shared/helpers/utils.ts
if (!companyId)
  return res.status(401).json({ success: false, error: "Unauthorized" });
```

### Auth & RBAC

```ts
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

router.use(requireAuth); // top of every routes file
router.get("/", requirePermission(Resource.X, Action.read), controller.getAll);
router.post(
  "/",
  requirePermission(Resource.X, Action.create),
  controller.create,
);
router.put(
  "/:id",
  requirePermission(Resource.X, Action.update),
  controller.update,
);
router.delete(
  "/:id",
  requirePermission(Resource.X, Action.delete),
  controller.delete,
);
```

- `Resource` and `Action` values come from `@sas/validators` — never hardcode strings
- Static path segments (`/search`, `/overdue`) must be declared **before** `/:id`

### Service Layer

- Every method takes `companyId: string` as first param
- Scope all queries with `companyId`
- `throw error` after logging — never return HTTP responses from services

```ts
logger.logError(error as Error, { operation: "methodName" });
throw error;
```

### Controller Layer

- Extract `companyId` first, guard with 401 before calling service
- Return `{ success: true, data, count? }` on success
- Return `{ success: false, error: "message" }` on failure
- Use `logger.logError` in catch, return 500

### Mongoose Models

- Always include `companyId: { type: String, required: true, index: true }`
- Always use `{ timestamps: true }` on the schema
- Export both the interface (`IMyModel`) and the model (`MyModel`)

### Logging

```ts
import logger from "../../config/logger.js";
logger.info("message", { context });
logger.logError(error as Error, { operation: "methodName" });
```

`console.log` is forbidden — always use `logger`.

### Error Classes

Use from `apps/backend/src/api/v1/shared/error-types/`:

- `AuthenticationError` → 401
- `AuthorizationError` → 403
- `ValidationError` → 422

### Route Registration

After creating a routes file, add it to `apps/backend/src/api/v1/routes/index.ts`:

```ts
import newRoutes from "../modules/{name}/{name}Routes.js";
app.use(`${API_PREFIX}/{plural-kebab-name}`, newRoutes);
```
