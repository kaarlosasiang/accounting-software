"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { permissionsService } from "@/lib/services/permissions.service";
import type { Resource, Action } from "@sas/validators";

export type EffectivePermissionsMap = Record<string, string[]>;

export function usePermissions() {
  const { user, isLoading: authLoading } = useAuth();
  const [permissions, setPermissions] =
    useState<EffectivePermissionsMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await permissionsService.getEffective(userId);
      setPermissions(response ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch permissions";
      setError(message);
      // Don't toast — permissions are fetched silently in the background
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchPermissions(user.id);
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [authLoading, user?.id, fetchPermissions]);

  /**
   * Check whether the current user has a specific permission.
   * Returns `true` while loading (optimistic) to avoid UI flicker.
   * Returns `false` once loading is done and no permission record exists —
   * deny by default rather than accidentally showing restricted items.
   */
  const can = useCallback(
    (resource: Resource, action: Action): boolean => {
      if (isLoading) return true; // optimistic while permissions are in-flight
      if (permissions == null) return false; // no record → deny
      const actions = permissions[resource as string];
      if (!actions) return false;
      return actions.includes(action);
    },
    [isLoading, permissions],
  );

  return {
    permissions,
    isLoading,
    error,
    can,
    refetch: user?.id ? () => fetchPermissions(user.id) : undefined,
  };
}
