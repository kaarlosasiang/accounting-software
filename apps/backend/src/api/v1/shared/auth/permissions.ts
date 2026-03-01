/**
 * RBAC enums and types — re-exported from the shared @sas/validators package.
 * All backend modules import from this path so they don't need to know about
 * the package boundary. The canonical source of truth lives in packages/validators.
 */
export {
  Resource,
  Action,
  OrgRole,
  DEFAULT_ROLE_PERMISSIONS,
} from "@sas/validators";

export type {
  ResourcePermission,
  RolePermissionMap,
  RoleDto,
  MemberPermissionDto,
  EffectivePermissions,
  EffectivePermissionsResponse,
} from "@sas/validators";
