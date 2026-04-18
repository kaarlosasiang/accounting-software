/**
 * RBAC enums and types — re-exported from the shared @sas/validators package.
 * All backend modules import from this path so they don't need to know about
 * the package boundary. The canonical source of truth lives in packages/validators.
 */
export type {
  EffectivePermissions,
  EffectivePermissionsResponse,
  MemberPermissionDto,
  ResourcePermission,
  RoleDto,
  RolePermissionMap,
} from "@sas/validators";
export {
  Action,
  DEFAULT_ROLE_PERMISSIONS,
  OrgRole,
  Resource,
} from "@sas/validators";
