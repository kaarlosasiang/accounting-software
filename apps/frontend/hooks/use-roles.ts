import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { RoleDto, ResourcePermission } from "@sas/validators";
import {
  rolesService,
  type CreateRoleData,
  type UpdateRoleData,
} from "@/lib/services/roles.service";

export function useRoles() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [defaults, setDefaults] = useState<
    Record<string, ResourcePermission[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await rolesService.getAll();
      setRoles(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch roles";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDefaults = useCallback(async () => {
    try {
      const data = await rolesService.getDefaults();
      setDefaults(data);
    } catch {
      // defaults are non-critical — fail silently
    }
  }, []);

  const createRole = useCallback(
    async (data: CreateRoleData): Promise<RoleDto | null> => {
      setIsLoading(true);
      try {
        const role = await rolesService.create(data);
        setRoles((prev) => [...prev, role]);
        toast.success("Role created");
        return role;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create role";
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateRole = useCallback(
    async (id: string, data: UpdateRoleData): Promise<RoleDto | null> => {
      setIsLoading(true);
      try {
        const role = await rolesService.update(id, data);
        setRoles((prev) => prev.map((r) => (r._id === id ? role : r)));
        toast.success("Role updated");
        return role;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update role";
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteRole = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await rolesService.delete(id);
      setRoles((prev) => prev.filter((r) => r._id !== id));
      toast.success("Role deleted");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete role";
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    roles,
    defaults,
    isLoading,
    error,
    fetchRoles,
    fetchDefaults,
    createRole,
    updateRole,
    deleteRole,
  };
}
