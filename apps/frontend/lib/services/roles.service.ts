import { apiFetch } from "@/lib/config/api-client";
import type { RoleDto, ResourcePermission } from "@sas/validators";

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: ResourcePermission[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: ResourcePermission[];
}

// ─── Service ──────────────────────────────────────────────────────────────────
// The backend returns raw values (no {success, data} envelope).

class RolesService {
  async getAll(): Promise<RoleDto[]> {
    return apiFetch<RoleDto[]>("/roles");
  }

  async getById(id: string): Promise<RoleDto> {
    return apiFetch<RoleDto>(`/roles/${id}`);
  }

  /** Returns the default permission set for each system role. */
  async getDefaults(): Promise<Record<string, ResourcePermission[]>> {
    return apiFetch<Record<string, ResourcePermission[]>>("/roles/defaults");
  }

  async create(data: CreateRoleData): Promise<RoleDto> {
    return apiFetch<RoleDto>("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: UpdateRoleData): Promise<RoleDto> {
    return apiFetch<RoleDto>(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<void> {
    await apiFetch<void>(`/roles/${id}`, { method: "DELETE" });
  }
}

export const rolesService = new RolesService();
