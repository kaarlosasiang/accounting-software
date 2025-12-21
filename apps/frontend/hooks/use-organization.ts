"use client";

import { useMemo } from "react";
import type { Organization } from "@/lib/types/auth";
import { useActiveOrganization, authClient } from "@/lib/config/auth-client";

export type OrganizationClient = {
  list: () => Promise<{ data?: Organization[]; error?: unknown } | undefined>;
  listMembers: (params: { organizationId?: string; limit?: number }) => Promise<{ data?: { members: any[] }; error?: unknown } | undefined>;
  inviteMember: (params: { email: string; role: string | string[]; organizationId?: string }) => Promise<{ data?: unknown; error?: { message?: string } } | undefined>;
  removeMember: (memberId: string, organizationId?: string) => Promise<void>;
  updateMemberRole: (params: { memberId: string; role: string | string[]; organizationId?: string }) => Promise<void>;
  setActive: (organizationId: string) => Promise<void>;
  create?: (params: { name: string; slug: string; logo?: string }) => Promise<{ data?: Organization; error?: { message?: string } } | undefined>;
} | null;

export type UseOrganizationReturn = {
  activeOrganization: Organization | null;
  hasActiveOrganization: boolean;
  organizationId: string | undefined;
  organizationName: string | undefined;
  organizationSlug: string | undefined;
  organization: OrganizationClient;
};

/**
 * Hook for organization functionality
 * @returns Organization utilities and active organization data
 */
export function useOrganization(): UseOrganizationReturn {
  const { data } = useActiveOrganization();

  // useActiveOrganization returns the active org data directly, not wrapped under a property
  const activeOrganization = (data ?? null) as Organization | null;
  const organization: OrganizationClient = (authClient as any)?.organization ?? null;

  const hasActiveOrganization = useMemo(() => !!activeOrganization, [activeOrganization]);

  const organizationId = useMemo(() => activeOrganization?.id, [activeOrganization]);

  const organizationName = useMemo(() => activeOrganization?.name, [activeOrganization]);

  const organizationSlug = useMemo(() => activeOrganization?.slug, [activeOrganization]);

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
  const getRole = async (): Promise<string | null> => null;
  const isOwner = async (): Promise<boolean> => false;
  const isAdmin = async (): Promise<boolean> => false;
  const isMember = async (): Promise<boolean> => false;

  return { getRole, isOwner, isAdmin, isMember };
}
