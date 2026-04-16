import { apiFetch } from "@/lib/config/api-client";
import type { CreatePersonnel, ResourcePermission } from "@sas/validators";

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface CreatedPersonnelDto {
  id: string;
  name: string;
  email: string;
  orgRole: string;
}

export interface StorePendingPermissionsData {
  email: string;
  roleId: string;
  grants?: ResourcePermission[];
  revocations?: ResourcePermission[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

class UsersService {
  /**
   * Create a personnel record directly (owner/admin only).
   * The backend provisions the user account, hashed credentials, org membership,
   * and initial RBAC permissions in a single atomic operation.
   */
  async createPersonnel(data: CreatePersonnel): Promise<CreatedPersonnelDto> {
    return apiFetch<CreatedPersonnelDto>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Store pre-configured permissions for a pending invitation.
   * Call this BEFORE sending an invite so that when the invitee accepts and
   * the system calls /members/provision, the custom role + overrides are
   * applied automatically.
   */
  async storePendingPermissions(
    data: StorePendingPermissionsData,
  ): Promise<unknown> {
    return apiFetch<unknown>("/members/pending-permissions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const usersService = new UsersService();
