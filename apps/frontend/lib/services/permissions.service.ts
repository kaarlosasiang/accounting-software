import { apiFetch } from "@/lib/config/api-client";
import type { MemberPermissionDto, ResourcePermission } from "@sas/validators";

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface AssignRoleData {
  roleId: string;
  grants?: ResourcePermission[];
  revocations?: ResourcePermission[];
}

export interface UpdateOverridesData {
  grants?: ResourcePermission[];
  revocations?: ResourcePermission[];
}

// ─── Service ──────────────────────────────────────────────────────────────────
// The backend returns raw values (no {success, data} envelope).

class PermissionsService {
  /** Get the raw MemberPermission record for a user (includes role + overrides). */
  async get(userId: string): Promise<MemberPermissionDto> {
    return apiFetch<MemberPermissionDto>(`/members/${userId}/permissions`);
  }

  /** Assign a role (and optional overrides) to a member. */
  async assign(
    userId: string,
    data: AssignRoleData,
  ): Promise<MemberPermissionDto> {
    return apiFetch<MemberPermissionDto>(`/members/${userId}/permissions`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /** Update only the per-user grants/revocations without changing their role. */
  async updateOverrides(
    userId: string,
    data: UpdateOverridesData,
  ): Promise<MemberPermissionDto> {
    return apiFetch<MemberPermissionDto>(
      `/members/${userId}/permissions/overrides`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  }

  /** Get the fully resolved effective permissions for a user. */
  async getEffective(userId: string): Promise<Record<string, string[]>> {
    return apiFetch<Record<string, string[]>>(
      `/members/${userId}/permissions/effective`,
    );
  }

  /**
   * Provision a MemberPermission record after accepting an invitation.
   * Uses $setOnInsert on the backend — safe to call multiple times.
   */
  async provisionMember(
    organizationId: string,
    roleName: string,
  ): Promise<void> {
    await apiFetch<unknown>("/members/provision", {
      method: "POST",
      body: JSON.stringify({ organizationId, roleName }),
    });
  }
}

export const permissionsService = new PermissionsService();
