/**
 * Shared RBAC types — used by both backend and frontend.
 * The backend imports these enums/types from here instead of defining them locally.
 * The frontend imports them from "@sas/validators" for type-safe permission checks.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Resource {
  accounts = "accounts",
  journalEntry = "journalEntry",
  invoice = "invoice",
  bill = "bill",
  payment = "payment",
  customer = "customer",
  supplier = "supplier",
  inventory = "inventory",
  report = "report",
  ledger = "ledger",
  companySetting = "companySetting",
  user = "user",
  period = "period",
  role = "role",
}

export enum Action {
  read = "read",
  create = "create",
  update = "update",
  delete = "delete",
}

export enum OrgRole {
  owner = "owner",
  admin = "admin",
  accountant = "accountant",
  staff = "staff",
  viewer = "viewer",
}

// ─── Permission types ─────────────────────────────────────────────────────────

export type ResourcePermission = {
  resource: Resource;
  actions: Action[];
};

export type RolePermissionMap = Record<Resource, Action[]>;

// ─── Default role permission map ──────────────────────────────────────────────

const ALL_ACTIONS: Action[] = [
  Action.read,
  Action.create,
  Action.update,
  Action.delete,
];

const READ_ONLY: Action[] = [Action.read];

const NO_ACCESS: Action[] = [];

const CRU: Action[] = [Action.read, Action.create, Action.update];

/**
 * Default permissions for each system role.
 * Used by the backend to seed the `roles` collection on startup.
 * Available on the frontend to pre-fill permission matrices.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<OrgRole, RolePermissionMap> = {
  [OrgRole.owner]: {
    [Resource.accounts]: ALL_ACTIONS,
    [Resource.journalEntry]: ALL_ACTIONS,
    [Resource.invoice]: ALL_ACTIONS,
    [Resource.bill]: ALL_ACTIONS,
    [Resource.payment]: ALL_ACTIONS,
    [Resource.customer]: ALL_ACTIONS,
    [Resource.supplier]: ALL_ACTIONS,
    [Resource.inventory]: ALL_ACTIONS,
    [Resource.report]: ALL_ACTIONS,
    [Resource.ledger]: ALL_ACTIONS,
    [Resource.companySetting]: ALL_ACTIONS,
    [Resource.user]: ALL_ACTIONS,
    [Resource.period]: ALL_ACTIONS,
    [Resource.role]: ALL_ACTIONS,
  },

  [OrgRole.admin]: {
    [Resource.accounts]: ALL_ACTIONS,
    [Resource.journalEntry]: ALL_ACTIONS,
    [Resource.invoice]: ALL_ACTIONS,
    [Resource.bill]: ALL_ACTIONS,
    [Resource.payment]: ALL_ACTIONS,
    [Resource.customer]: ALL_ACTIONS,
    [Resource.supplier]: ALL_ACTIONS,
    [Resource.inventory]: ALL_ACTIONS,
    [Resource.report]: ALL_ACTIONS,
    [Resource.ledger]: ALL_ACTIONS,
    [Resource.companySetting]: ALL_ACTIONS,
    [Resource.user]: ALL_ACTIONS,
    [Resource.period]: ALL_ACTIONS,
    [Resource.role]: ALL_ACTIONS,
  },

  [OrgRole.accountant]: {
    [Resource.accounts]: ALL_ACTIONS,
    [Resource.journalEntry]: ALL_ACTIONS,
    [Resource.invoice]: ALL_ACTIONS,
    [Resource.bill]: ALL_ACTIONS,
    [Resource.payment]: ALL_ACTIONS,
    [Resource.customer]: ALL_ACTIONS,
    [Resource.supplier]: ALL_ACTIONS,
    [Resource.inventory]: ALL_ACTIONS,
    [Resource.report]: READ_ONLY,
    [Resource.ledger]: READ_ONLY,
    [Resource.companySetting]: NO_ACCESS,
    [Resource.user]: NO_ACCESS,
    [Resource.period]: ALL_ACTIONS,
    [Resource.role]: NO_ACCESS,
  },

  [OrgRole.staff]: {
    [Resource.accounts]: READ_ONLY,
    [Resource.journalEntry]: NO_ACCESS,
    [Resource.invoice]: CRU,
    [Resource.bill]: CRU,
    [Resource.payment]: ALL_ACTIONS,
    [Resource.customer]: ALL_ACTIONS,
    [Resource.supplier]: ALL_ACTIONS,
    [Resource.inventory]: ALL_ACTIONS,
    [Resource.report]: READ_ONLY,
    [Resource.ledger]: READ_ONLY,
    [Resource.companySetting]: NO_ACCESS,
    [Resource.user]: NO_ACCESS,
    [Resource.period]: NO_ACCESS,
    [Resource.role]: NO_ACCESS,
  },

  [OrgRole.viewer]: {
    [Resource.accounts]: READ_ONLY,
    [Resource.journalEntry]: READ_ONLY,
    [Resource.invoice]: READ_ONLY,
    [Resource.bill]: READ_ONLY,
    [Resource.payment]: READ_ONLY,
    [Resource.customer]: READ_ONLY,
    [Resource.supplier]: READ_ONLY,
    [Resource.inventory]: READ_ONLY,
    [Resource.report]: READ_ONLY,
    [Resource.ledger]: READ_ONLY,
    [Resource.companySetting]: NO_ACCESS,
    [Resource.user]: NO_ACCESS,
    [Resource.period]: READ_ONLY,
    [Resource.role]: NO_ACCESS,
  },
};

// ─── Frontend DTO types ───────────────────────────────────────────────────────

/** Plain object representation of a Role document (safe for frontend) */
export type RoleDto = {
  _id: string;
  name: string;
  description?: string;
  companyId: string | null;
  isSystem: boolean;
  permissions: ResourcePermission[];
  createdAt: string;
  updatedAt: string;
};

/** Plain object representation of a MemberPermission document (safe for frontend) */
export type MemberPermissionDto = {
  _id: string;
  userId: string;
  organizationId: string;
  roleId: RoleDto | string;
  grants: ResourcePermission[];
  revocations: ResourcePermission[];
  createdAt: string;
  updatedAt: string;
};

/** Effective permissions resolved for a user — what they can actually do */
export type EffectivePermissions = Partial<Record<Resource, Action[]>>;

/** Shape returned by GET /members/:userId/permissions/effective */
export type EffectivePermissionsResponse = {
  userId: string;
  organizationId: string;
  permissions: EffectivePermissions;
};
