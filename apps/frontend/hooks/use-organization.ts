"use client";

import { useMemo, useEffect } from "react";
import type {
  Organization,
  ParsedOrganization,
  CompanyAddress,
  CompanyContact,
  CompanyMetadata,
  BusinessType,
} from "@/lib/types/auth";
import {
  useActiveOrganization,
  useListOrganizations,
  useSession,
  authClient,
} from "@/lib/config/auth-client";

export type OrganizationClient = {
  list: () => Promise<{ data?: Organization[]; error?: unknown } | undefined>;
  listMembers: (params: {
    query?: {
      organizationId?: string;
      limit?: number;
    };
  }) => Promise<{ data?: { members: any[] }; error?: unknown } | undefined>;
  inviteMember: (params: {
    email: string;
    role: string | string[];
    organizationId?: string;
  }) => Promise<{ data?: unknown; error?: { message?: string } } | undefined>;
  removeMember: (params: {
    memberIdOrEmail: string;
    organizationId?: string;
  }) => Promise<{ data?: unknown; error?: unknown }>;
  updateMemberRole: (params: {
    memberId: string;
    role: string | string[];
    organizationId?: string;
  }) => Promise<{ data?: unknown; error?: unknown }>;
  setActive: (params: {
    organizationId: string | null;
  }) => Promise<{ data?: unknown; error?: unknown }>;
  create?: (params: {
    name: string;
    slug: string;
    logo?: string;
    metadata?: CompanyMetadata;
    // Company-specific scalar fields
    businessType?: BusinessType;
    taxId?: string;
    fiscalYearStart?: string;
    currency?: string;
    headerText?: string;
    isActive?: boolean;
  }) => Promise<
    { data?: Organization; error?: { message?: string } } | undefined
  >;
  update?: (params: {
    organizationId?: string;
    data: {
      name?: string;
      slug?: string;
      logo?: string;
      metadata?: CompanyMetadata;
      // Company-specific scalar fields
      businessType?: BusinessType;
      taxId?: string;
      fiscalYearStart?: string;
      currency?: string;
      headerText?: string;
      isActive?: boolean;
    };
  }) => Promise<
    { data?: Organization; error?: { message?: string } } | undefined
  >;
} | null;

export type UseOrganizationReturn = {
  /** Raw organization data from API */
  activeOrganization: Organization | null;
  /** Alias for activeOrganization (same type now) */
  company: ParsedOrganization | null;
  hasActiveOrganization: boolean;
  organizationId: string | undefined;
  organizationName: string | undefined;
  organizationSlug: string | undefined;
  organization: OrganizationClient;
  isPending: boolean;
  error: Error | null;
  // Company-specific getters (from additionalFields)
  businessType: BusinessType | undefined;
  taxId: string | undefined;
  fiscalYearStart: string | undefined;
  currency: string | undefined;
  headerText: string | undefined;
  isActive: boolean | undefined;
  // Metadata getters (nested objects)
  addresses: CompanyAddress[] | undefined;
  contacts: CompanyContact[] | undefined;
  industry: string | undefined;
  companySize: string | undefined;
  description: string | undefined;
};

/**
 * Hook for organization/company functionality
 * @returns Organization utilities and active organization (company) data
 */
export function useOrganization(): UseOrganizationReturn {
  const { data: activeOrgData, isPending, error } = useActiveOrganization();
  const { data: sessionData } = useSession();
  const { data: organizationsData } = useListOrganizations();

  // Debug logging (only when data changes)
  useEffect(() => {
    console.log("[useOrganization] Hook state:", {
      activeOrgData,
      hasActiveOrg: !!activeOrgData,
      isPending,
      error,
      sessionExists: !!sessionData,
      organizationsCount: Array.isArray(organizationsData)
        ? organizationsData.length
        : 0,
    });
  }, [activeOrgData, isPending, error, sessionData, organizationsData]);

  // Better-auth's useActiveOrganization returns the organization directly in data
  // If null/undefined, it means no active organization is set
  const activeOrganization =
    (activeOrgData as Organization | null | undefined) ?? null;

  // Auto-set first organization as active if none is set but user has organizations
  useEffect(() => {
    if (!isPending && !activeOrganization && organizationsData) {
      const orgs =
        (organizationsData as Organization[] | null | undefined) ?? [];

      if (orgs.length > 0 && orgs[0]) {
        const firstOrg = orgs[0];
        const orgClient = (authClient as any)?.organization;
        if (orgClient?.setActive) {
          orgClient
            .setActive({ organizationId: firstOrg.id })
            .catch((err: Error) => {
              console.error("Failed to auto-set active organization:", err);
            });
        }
      }
    }
  }, [isPending, activeOrganization, organizationsData]);
  const organization: OrganizationClient =
    (authClient as any)?.organization ?? null;

  const hasActiveOrganization = useMemo(
    () => !!activeOrganization,
    [activeOrganization]
  );

  const organizationId = useMemo(
    () => activeOrganization?.id,
    [activeOrganization]
  );

  const organizationName = useMemo(
    () => activeOrganization?.name,
    [activeOrganization]
  );

  const organizationSlug = useMemo(
    () => activeOrganization?.slug,
    [activeOrganization]
  );

  // Get data from metadata (nested objects)
  const metadata = activeOrganization?.metadata;
  const addresses = useMemo(() => metadata?.address, [metadata?.address]);
  const contacts = useMemo(() => metadata?.contact, [metadata?.contact]);
  const industry = useMemo(() => metadata?.industry, [metadata?.industry]);
  const companySize = useMemo(
    () => metadata?.companySize,
    [metadata?.companySize]
  );
  const description = useMemo(
    () => metadata?.description,
    [metadata?.description]
  );

  return {
    activeOrganization,
    company: activeOrganization, // Same type now
    hasActiveOrganization,
    organizationId,
    organizationName,
    organizationSlug,
    organization,
    isPending,
    error: error ?? null,
    // Company-specific getters (from additionalFields)
    businessType: activeOrganization?.businessType,
    taxId: activeOrganization?.taxId,
    fiscalYearStart: activeOrganization?.fiscalYearStart,
    currency: activeOrganization?.currency,
    headerText: activeOrganization?.headerText,
    isActive: activeOrganization?.isActive,
    // Metadata getters (nested objects)
    addresses,
    contacts,
    industry,
    companySize,
    description,
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

/**
 * Hook for listing all organizations (companies) the user is a member of
 * @returns List of organizations with loading/error states
 */
export function useOrganizations() {
  const { data, isPending, error } = useListOrganizations();

  const organizations = useMemo(() => {
    // better-auth returns array directly in data, handle null/undefined
    return (data as Organization[] | null | undefined) ?? [];
  }, [data]);

  return {
    organizations,
    isPending,
    error: error ?? null,
  };
}

// Re-export hooks from auth-client for convenience
export {
  useActiveOrganization,
  useListOrganizations,
} from "@/lib/config/auth-client";
