# Skill: Add a New Backend Module

Use this skill whenever creating a new domain module in `apps/backend/src/api/v1/modules/`.

**Canonical template**: `apps/backend/src/api/v1/modules/invoice/`

---

## Pre-flight Checks (do these BEFORE writing any code)

1. **Does the module already exist?**
   Search `apps/backend/src/api/v1/modules/` — if a folder already exists, read it before modifying.

2. **Does the route already exist?**
   Read `apps/backend/src/api/v1/routes/index.ts` and check the registered paths.

3. **Does a validator already exist in `@sas/validators`?**
   Read `packages/validators/src/index.ts` — use the existing schema. If it does not exist, add it to `packages/validators/src/` following the same pattern as `packages/validators/src/bill.validators.ts`.

4. **Does a Mongoose model already exist?**
   Check `apps/backend/src/api/v1/models/` — read the file before referencing any fields.

5. **Is the `Resource` enum value already declared?**
   Read `packages/validators/src/permissions.ts` — use the existing value, never hardcode a string.

---

## Step-by-Step Checklist

### Step 1 — Mongoose Model (if new)

**Location**: `apps/backend/src/api/v1/models/{ModelName}.ts`

Rules:

- Every document **must** have `companyId: { type: String, required: true, index: true }`
- Use `mongoose.Schema` with `{ timestamps: true }`
- Export the model as a named export: `export const MyModel = mongoose.model<IMyModel>("MyModel", mySchema)`
- Export the TypeScript interface/document type too

```ts
// Minimal skeleton
import mongoose, { Document, Schema } from "mongoose";

export interface IMyModel {
  companyId: string;
  // ... fields
}

export interface IMyModelDocument extends IMyModel, Document {}

const mySchema = new Schema<IMyModelDocument>(
  {
    companyId: { type: String, required: true, index: true },
    // ... fields
  },
  { timestamps: true },
);

export const MyModel = mongoose.model<IMyModelDocument>("MyModel", mySchema);
```

---

### Step 2 — Validator (if new)

**Location**: `packages/validators/src/{name}.validators.ts`

Rules:

- Use `zod` (already installed — do not add it again)
- Export a named `const` schema: `export const mySchema = z.object({ ... })`
- Export the inferred TypeScript type: `export type MyType = z.infer<typeof mySchema>`
- Then re-export from `packages/validators/src/index.ts`

---

### Step 3 — Service

**Location**: `apps/backend/src/api/v1/modules/{name}/{name}Service.ts`

Rules:

- Export as a plain object: `export const myService = { async getAll(...) {...}, ... }`
- Every method receives `companyId: string` as the first param and scopes all queries with it
- Use `logger.logError(error as Error, { operation: "methodName" })` in catch blocks, then `throw error`
- Never return HTTP responses — that is the controller's job

```ts
import { MyModel } from "../../models/MyModel.js";
import logger from "../../config/logger.js";

export const myService = {
  async getAll(companyId: string) {
    try {
      return await MyModel.find({ companyId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.logError(error as Error, { operation: "getAll" });
      throw error;
    }
  },
};
```

---

### Step 4 — Controller

**Location**: `apps/backend/src/api/v1/modules/{name}/{name}Controller.ts`

Rules:

- Import `getCompanyId` and `getUserId` from `../../shared/helpers/utils.js`
- Always check `companyId` first and return 401 if missing
- Call service methods, return standard JSON response shape
- Use `logger.logError` in catch blocks, return 500

```ts
import { Request, Response } from "express";
import { myService } from "./myService.js";
import { getCompanyId } from "../../shared/helpers/utils.js";
import logger from "../../config/logger.js";

export const myController = {
  async getAll(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }
      const data = await myService.getAll(companyId);
      return res.status(200).json({ success: true, data, count: data.length });
    } catch (error) {
      logger.logError(error as Error, { operation: "getAll" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
};
```

---

### Step 5 — Routes File

**Location**: `apps/backend/src/api/v1/modules/{name}/{name}Routes.ts`

Rules:

- `router.use(requireAuth)` at the top — applies to ALL routes in the file
- Wrap each route with `requirePermission(Resource.X, Action.Y)`
- Use the correct `Resource` enum value — verify it exists in `packages/validators/src/permissions.ts`
- Static path segments (e.g., `/search`, `/overdue`) must be declared **before** `/:id` routes

```ts
import express from "express";
import { myController } from "./myController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission(Resource.myResource, Action.read),
  myController.getAll,
);
router.post(
  "/",
  requirePermission(Resource.myResource, Action.create),
  myController.create,
);
router.get(
  "/:id",
  requirePermission(Resource.myResource, Action.read),
  myController.getById,
);
router.put(
  "/:id",
  requirePermission(Resource.myResource, Action.update),
  myController.update,
);
router.delete(
  "/:id",
  requirePermission(Resource.myResource, Action.delete),
  myController.delete,
);

export default router;
```

---

### Step 6 — Register the Route

**File**: `apps/backend/src/api/v1/routes/index.ts`

Read the file first to identify the correct insertion point, then add:

```ts
import myRoutes from "../modules/{name}/{name}Routes.js";
// ...
app.use(`${API_PREFIX}/{plural-kebab-name}`, myRoutes);
```

---

## Post-implementation Checklist

- [ ] Model has `companyId` field with `index: true`
- [ ] All service methods scope queries by `companyId`
- [ ] All controller methods check for `companyId` before calling the service
- [ ] All routes have `requireAuth` applied at the router level
- [ ] All routes have `requirePermission` with correct `Resource` + `Action` enums
- [ ] Route registered in `apps/backend/src/api/v1/routes/index.ts`
- [ ] No `console.log` — only `logger.info` / `logger.logError`
- [ ] No inline Zod schemas — all validation from `@sas/validators`
- [ ] No hardcoded strings for resource names or actions
