---
applyTo: "packages/validators/**"
---

## Validators Package Rules — Always Active

### Purpose

`packages/validators` is the **single source of truth** for validation schemas and RBAC enums.
Both `apps/backend` and `apps/frontend` import from `@sas/validators`. Never duplicate a schema elsewhere.

### Adding a New Schema

1. Create `packages/validators/src/{name}.validators.ts`
2. Follow the pattern of `packages/validators/src/bill.validators.ts`
3. Export a named const schema and its inferred type:

```ts
import { z } from "zod";

export const mySchema = z.object({
  companyId: z.string().min(1),
  // ... fields
});

export type MyType = z.infer<typeof mySchema>;
```

4. Re-export from `packages/validators/src/index.ts`
5. Run `pnpm build:validators` after changes — frontend/backend imports will fail otherwise

### RBAC Enums (`permissions.ts`)

- `Resource` — the domain entity (e.g., `invoice`, `bill`, `customer`)
- `Action` — `read | create | update | delete`
- `OrgRole` — `owner | admin | accountant | staff | viewer`
- `DEFAULT_ROLE_PERMISSIONS` — the full permission matrix

**Before adding a new `Resource` value**: check if one already exists that covers the domain.
**Never** hardcode resource or action strings anywhere in the codebase — always import the enums.

### Build Requirement

Any change to this package requires a rebuild before dependent apps pick it up:

```bash
pnpm build:validators
```
