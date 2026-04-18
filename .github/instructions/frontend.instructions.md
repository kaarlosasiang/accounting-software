---
applyTo: "apps/frontend/**"
---

## Frontend Rules — Always Active

### Scope Boundary

- Check `apps/frontend/lib/services/` before creating a new service
- Check `apps/frontend/hooks/` before creating a new hook
- Check `packages/ui/components/` or `apps/frontend/components/ui/` before creating any UI component
- Read `packages/validators/src/permissions.ts` before using any `Resource` or `Action` value
- Never suggest a dependency not already in `apps/frontend/package.json`

### Pattern (canonical: `invoice.service.ts` + `use-invoices.ts`)

```
lib/services/{name}.service.ts   → apiFetch wrappers + TypeScript interfaces
hooks/use-{name}.ts              → useState + useCallback, calls service
app/(protected)/{name}/page.tsx  → "use client" page consuming the hook
```

### API Client — No Exceptions

```ts
import { apiFetch } from "@/lib/config/api-client";

// GET
apiFetch<{ success: boolean; data: T[] }>("/resource");
// POST
apiFetch<{ success: boolean; data: T }>("/resource", {
  method: "POST",
  body: JSON.stringify(payload),
});
```

- Never call `fetch` directly
- Never hardcode API URLs — always use relative paths

### Active Organization (companyId)

```ts
import { authClient } from "@/lib/config/auth-client";
const { data: activeOrg } = authClient.useActiveOrganization();
const companyId = activeOrg?.id;
```

### Auth Context

```ts
import { useAuth } from "@/lib/contexts/auth-context";
const { user, session, isLoading } = useAuth();
```

### Hook Pattern

```ts
import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useMyItems() {
  const [items, setItems] = useState<MyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await myService.getAll();
      if (res.success) setItems(res.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed";
      setError(message);
      toast.error(message); // always toast on error
    } finally {
      setIsLoading(false); // always in finally
    }
  }, []);
  // mutations: toast.success on success, toast.error on failure
}
```

### Permission Guard

```tsx
import { PermissionGuard } from "@/lib/auth/permission-guard";
import type { Resource, Action } from "@sas/validators";

<PermissionGuard resource={Resource.invoice} action={Action.create}>
  <CreateButton />
</PermissionGuard>;
```

Wrap every create / update / delete action in a `<PermissionGuard>`.

### UI Components

- Import from `@/components/ui/{component}` — re-exported from `@sas/ui`
- Never define base UI primitives inline
- Use `<Skeleton />` for page-level loading, `<Spinner />` for inline loading

### Toast Notifications

```ts
import { toast } from "sonner";
toast.success("Invoice created");
toast.error("Failed to create invoice");
```

### Page Component Rules

- All authenticated pages live under `app/(protected)/`
- Mark data-fetching pages `"use client"`
- Fetch on mount: `useEffect(() => { fetchItems(); }, [fetchItems])`
- RBAC strings come from `@sas/validators` enums — never hardcode
