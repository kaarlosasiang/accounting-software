# Skill: Add a New Frontend Feature

Use this skill whenever adding a new data-driven feature to `apps/frontend/`.

**Canonical template**: `hooks/use-invoices.ts` + `lib/services/invoice.service.ts`

---

## Pre-flight Checks (do these BEFORE writing any code)

1. **Does the service already exist?**
   Check `apps/frontend/lib/services/` — if it does, read it before modifying.

2. **Does the hook already exist?**
   Check `apps/frontend/hooks/` — if it does, read it before modifying.

3. **Does the page route already exist?**
   Check `apps/frontend/app/(protected)/` — read the existing `page.tsx` before rewriting.

4. **Do the UI components already exist?**
   Check `packages/ui/components/` or `apps/frontend/components/ui/` before creating new ones.
   Import via `@/components/ui/{component}` — never define base UI primitives inline.

5. **Is there already a relevant `Resource` + `Action` for permission guards?**
   Read `packages/validators/src/permissions.ts` — use existing enum values only.

---

## Step-by-Step Checklist

### Step 1 — Service File

**Location**: `apps/frontend/lib/services/{name}.service.ts`

Rules:

- All HTTP calls use `apiFetch` from `@/lib/config/api-client` — never call `fetch` directly
- Never hardcode API URLs — use relative paths (e.g., `"/invoices"`)
- Export TypeScript interfaces for all data shapes alongside the service
- Export a plain object: `export const myService = { async getAll() {...}, ... }`

```ts
import { apiFetch } from "@/lib/config/api-client";

export interface MyItem {
  _id: string;
  companyId: string;
  // ... fields matching the backend model
}

export interface MyItemFormData {
  // ... fields for create/update
}

export const myService = {
  async getAll(): Promise<{ success: boolean; data: MyItem[]; count: number }> {
    return apiFetch("/my-items");
  },

  async getById(id: string): Promise<{ success: boolean; data: MyItem }> {
    return apiFetch(`/my-items/${id}`);
  },

  async create(
    data: MyItemFormData,
  ): Promise<{ success: boolean; data: MyItem }> {
    return apiFetch("/my-items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: string,
    data: Partial<MyItemFormData>,
  ): Promise<{ success: boolean; data: MyItem }> {
    return apiFetch(`/my-items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return apiFetch(`/my-items/${id}`, { method: "DELETE" });
  },
};
```

---

### Step 2 — Hook

**Location**: `apps/frontend/hooks/use-{name}.ts`

Rules:

- Use `useState` + `useCallback` — no raw React Query in hooks (follow existing pattern)
- Show toast feedback on error: `toast.error(message)` from `sonner`
- Show toast feedback on success for mutations: `toast.success("...")`
- Return `{ items, isLoading, error, fetchItems, createItem, ... }` — keep the API surface flat
- Always `setIsLoading(true)` at start of async operations, `setIsLoading(false)` in `finally`

```ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { myService, MyItem, MyItemFormData } from "@/lib/services/my.service";

export function useMyItems() {
  const [items, setItems] = useState<MyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await myService.getAll();
      if (response.success) {
        setItems(response.data);
      } else {
        throw new Error("Failed to fetch items");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch items";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createItem = useCallback(
    async (data: MyItemFormData) => {
      setIsLoading(true);
      try {
        const response = await myService.create(data);
        if (response.success) {
          toast.success("Item created");
          await fetchItems();
          return response.data;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create item";
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchItems],
  );

  return { items, isLoading, error, fetchItems, createItem };
}
```

---

### Step 3 — Page Component

**Location**: `apps/frontend/app/(protected)/{feature}/page.tsx`

Rules:

- Mark as `"use client"` — all data-fetching pages are client components
- Call `useEffect(() => { fetchItems(); }, [fetchItems])` to load on mount
- Wrap content requiring permissions in `<PermissionGuard resource={...} action={...}>`
- Import UI primitives from `@/components/ui/{component}` — check `packages/ui/components/` first
- Show loading state with `<Skeleton />` from `@/components/ui/skeleton`
- Use `<Spinner />` for inline loading states

```tsx
"use client";

import { useEffect } from "react";
import { useMyItems } from "@/hooks/use-my-items";
import { PermissionGuard } from "@/lib/auth/permission-guard";
import { Resource, Action } from "@sas/validators";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyFeaturePage() {
  const { items, isLoading, fetchItems } = useMyItems();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div>
      <PermissionGuard resource={Resource.myResource} action={Action.create}>
        <Button
          onClick={() => {
            /* open form */
          }}
        >
          Add Item
        </Button>
      </PermissionGuard>

      {/* render items */}
    </div>
  );
}
```

---

### Step 4 — Navigation (if needed)

The sidebar navigation lives in `apps/frontend/`. Search for the sidebar component before adding navigation links — do not hardcode URLs in components.

---

## Post-implementation Checklist

- [ ] Service uses `apiFetch` — no direct `fetch` calls
- [ ] Service has no hardcoded API URLs
- [ ] TypeScript interfaces defined in the service file and match backend model fields
- [ ] Hook uses `useState` + `useCallback` following `use-invoices.ts` pattern
- [ ] Hook shows `toast.error` on failures and `toast.success` on mutations
- [ ] Page is under `app/(protected)/`
- [ ] Page uses `<PermissionGuard>` for create/update/delete actions
- [ ] UI components imported from `@/components/ui/` — none defined inline
- [ ] No hardcoded `Resource` or `Action` strings — always use the enums from `@sas/validators`
