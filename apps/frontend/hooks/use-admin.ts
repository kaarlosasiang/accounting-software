"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { authClient } from "@/lib/config/auth-client";

/**
 * Hook for admin functionality and permission checking
 * @returns Admin utilities and permission checks
 */
export function useAdmin() {
  const { user, session } = useAuth();

  // Check if user is an admin
  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    const roles = user.role.split(",").map((r) => r.trim());
    return roles.includes("admin") || roles.includes("super_admin");
  }, [user?.role]);

  // Check if user is being impersonated
  const isImpersonated = useMemo(() => {
    return !!session?.impersonatedBy;
  }, [session?.impersonatedBy]);

  // Check if user is banned
  const isBanned = useMemo(() => {
    return !!user?.banned;
  }, [user?.banned]);

  // Get impersonator ID
  const impersonatorId = useMemo(() => {
    return session?.impersonatedBy;
  }, [session?.impersonatedBy]);

  return {
    isAdmin,
    isImpersonated,
    isBanned,
    impersonatorId,
    admin: authClient.admin,
  };
}
