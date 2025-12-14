"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import type { Organization, Member } from "@/lib/types/auth";

/**
 * Hook for organization functionality
 * @returns Organization utilities and active organization data
 */
export function useOrganization() {
  const { activeOrganization, organization, user } = useAuth();

  // Check if user has an active organization
  const hasActiveOrganization = useMemo(() => {
    return !!activeOrganization;
  }, [activeOrganization]);

  // Get organization ID
  const organizationId = useMemo(() => {
    return activeOrganization?.id;
  }, [activeOrganization?.id]);

  // Get organization name
  const organizationName = useMemo(() => {
    return activeOrganization?.name;
  }, [activeOrganization?.name]);

  // Get organization slug
  const organizationSlug = useMemo(() => {
    return activeOrganization?.slug;
  }, [activeOrganization?.slug]);

  return {
    activeOrganization,
    hasActiveOrganization,
    organizationId,
    organizationName,
    organizationSlug,
    organization,
  };
}

/**
 * Hook for checking organization member role
 * @returns Member role utilities
 */
export function useOrganizationRole() {
  const { organization } = useAuth();

  const getRole = async (): Promise<string | null> => {
    try {
      const result: any = await organization.getActiveMember();
      return result?.data?.role || null;
    } catch {
      return null;
    }
  };

  const isOwner = async (): Promise<boolean> => {
    const role = await getRole();
    return role?.includes("owner") || false;
  };

  const isAdmin = async (): Promise<boolean> => {
    const role = await getRole();
    return role?.includes("admin") || role?.includes("owner") || false;
  };

  const isMember = async (): Promise<boolean> => {
    const role = await getRole();
    return !!role;
  };

  return {
    getRole,
    isOwner,
    isAdmin,
    isMember,
  };
}
