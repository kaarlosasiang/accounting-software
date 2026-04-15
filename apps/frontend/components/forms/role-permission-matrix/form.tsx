"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Resource,
  Action,
  type ResourcePermission,
  type RolePermissionMap,
} from "@sas/validators";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Human-readable labels for each resource */
const RESOURCE_LABELS: Record<Resource, string> = {
  [Resource.accounts]: "Chart of Accounts",
  [Resource.journalEntry]: "Journal Entries",
  [Resource.invoice]: "Invoices",
  [Resource.bill]: "Bills",
  [Resource.payment]: "Payments",
  [Resource.customer]: "Customers",
  [Resource.supplier]: "Suppliers",
  [Resource.inventory]: "Inventory",
  [Resource.report]: "Reports",
  [Resource.ledger]: "Ledger",
  [Resource.companySetting]: "Company Settings",
  [Resource.user]: "Users",
  [Resource.period]: "Accounting Periods",
  [Resource.role]: "Roles",
};

const ALL_RESOURCES = Object.values(Resource);
const ALL_ACTIONS = Object.values(Action);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PermissionMatrixValue {
  grants: ResourcePermission[];
  revocations: ResourcePermission[];
}

interface RolePermissionMatrixProps {
  /**
   * "role" — freely toggle any permission to build a role's permission set.
   *          `value.grants` represents the role's full permissions.
   * "override" — show only deltas relative to `basePermissions`.
   *              checking a cell that isn't in base = grant,
   *              unchecking a cell that IS in base = revocation.
   */
  mode: "role" | "override";
  value: PermissionMatrixValue;
  onChange: (value: PermissionMatrixValue) => void;
  /** Pre-fill checklist — required for mode="override", optional for mode="role" */
  basePermissions?: RolePermissionMap;
  /** Disable all interaction (e.g. system roles) */
  disabled?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasAction(
  perms: ResourcePermission[],
  resource: Resource,
  action: Action,
) {
  return perms.some(
    (p) => p.resource === resource && p.actions.includes(action),
  );
}

function setAction(
  perms: ResourcePermission[],
  resource: Resource,
  action: Action,
  enabled: boolean,
): ResourcePermission[] {
  const existing = perms.find((p) => p.resource === resource);

  if (enabled) {
    if (!existing) {
      return [...perms, { resource, actions: [action] }];
    }
    if (existing.actions.includes(action)) return perms;
    return perms.map((p) =>
      p.resource === resource ? { ...p, actions: [...p.actions, action] } : p,
    );
  } else {
    if (!existing) return perms;
    const next = existing.actions.filter((a) => a !== action);
    if (next.length === 0) return perms.filter((p) => p.resource !== resource);
    return perms.map((p) =>
      p.resource === resource ? { ...p, actions: next } : p,
    );
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RolePermissionMatrix({
  mode,
  value,
  onChange,
  basePermissions,
  disabled = false,
}: RolePermissionMatrixProps) {
  /**
   * For mode="role": checked = action is in grants
   * For mode="override":
   *   - base has it AND in revocations = unchecked (revoked)
   *   - base has it AND not in revocations = checked (inherited)
   *   - base doesn't have it AND in grants = checked (granted)
   *   - base doesn't have it AND not in grants = unchecked (not granted)
   */
  const isChecked = useMemo(
    () =>
      (resource: Resource, action: Action): boolean => {
        if (mode === "role") {
          return hasAction(value.grants, resource, action);
        }
        // mode === "override"
        const inBase = basePermissions?.[resource]?.includes(action) ?? false;
        const inGrants = hasAction(value.grants, resource, action);
        const inRevocations = hasAction(value.revocations, resource, action);
        if (inBase) return !inRevocations;
        return inGrants;
      },
    [mode, value, basePermissions],
  );

  const handleChange = (
    resource: Resource,
    action: Action,
    checked: boolean,
  ) => {
    if (disabled) return;

    if (mode === "role") {
      onChange({
        grants: setAction(value.grants, resource, action, checked),
        revocations: [],
      });
      return;
    }

    // mode === "override"
    const inBase = basePermissions?.[resource]?.includes(action) ?? false;

    if (inBase) {
      // Toggle revocation: unchecking adds revocation, checking removes it
      if (!checked) {
        onChange({
          ...value,
          revocations: setAction(value.revocations, resource, action, true),
        });
      } else {
        onChange({
          ...value,
          revocations: setAction(value.revocations, resource, action, false),
        });
      }
    } else {
      // Toggle grant: checking adds grant, unchecking removes it
      onChange({
        ...value,
        grants: setAction(value.grants, resource, action, checked),
      });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-48">
              Resource
            </th>
            {ALL_ACTIONS.map((action) => (
              <th
                key={action}
                className="text-center py-2 px-3 font-medium text-muted-foreground capitalize"
              >
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ALL_RESOURCES.map((resource) => (
            <tr
              key={resource}
              className="border-b hover:bg-muted/30 transition-colors"
            >
              <td className="py-2 pr-4 font-medium">
                {RESOURCE_LABELS[resource]}
              </td>
              {ALL_ACTIONS.map((action) => {
                const checked = isChecked(resource, action);
                const inBase =
                  basePermissions?.[resource]?.includes(action) ?? false;
                // In override mode, show a subtle indicator for inherited permissions
                const isInherited =
                  mode === "override" &&
                  inBase &&
                  !hasAction(value.revocations, resource, action);
                const isGrantOverride =
                  mode === "override" &&
                  !inBase &&
                  hasAction(value.grants, resource, action);

                return (
                  <td key={action} className="text-center py-2 px-3">
                    <div className="flex flex-col items-center gap-1">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(val) =>
                          handleChange(resource, action, val === true)
                        }
                        disabled={disabled}
                        aria-label={`${resource} ${action}`}
                      />
                      {mode === "override" && isGrantOverride && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4 text-green-600 border-green-300"
                        >
                          +grant
                        </Badge>
                      )}
                      {mode === "override" &&
                        inBase &&
                        hasAction(value.revocations, resource, action) && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 h-4 text-red-600 border-red-300"
                          >
                            −revoke
                          </Badge>
                        )}
                      {mode === "override" && isInherited && (
                        <span className="text-[10px] text-muted-foreground">
                          base
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
