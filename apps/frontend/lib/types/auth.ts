import type { User as BetterAuthUser, Session as BetterAuthSession } from "better-auth/types";

/**
 * Extended User type with additional fields from Better Auth configuration.
 * These fields are defined in the backend betterAuth.ts configuration.
 */
export interface User extends BetterAuthUser {
  // Additional user fields from backend configuration
  companyId?: string;
  role?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone_number?: string;
  username?: string;

  // Subscription fields
  hasActiveSubscription?: boolean;
  subscriptionPlan?: string;
  subscriptionStatus?: string;

  // Admin plugin fields
  banned?: boolean;
  banReason?: string;
  banExpires?: number;
}

/**
 * Extended Session type with admin plugin fields
 */
export interface Session extends BetterAuthSession {
  impersonatedBy?: string | null;
}

/**
 * Session data returned by useSession hook
 */
export interface SessionData {
  session: Session;
  user: User;
}

/**
 * Admin plugin types
 */
export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: string | string[];
  data?: Record<string, any>;
}

export interface ListUsersQuery {
  searchValue?: string;
  searchField?: "email" | "name";
  searchOperator?: "contains" | "starts_with" | "ends_with";
  limit?: string | number;
  offset?: string | number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  filterField?: string;
  filterValue?: string | number | boolean;
  filterOperator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
}

export interface ListUsersResponse {
  users: User[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface BanUserData {
  userId: string;
  banReason?: string;
  banExpiresIn?: number;
}

export interface UpdateUserData {
  userId: string;
  data: Record<string, any>;
}

export interface SetRoleData {
  userId: string;
  role: string | string[];
}

export interface SetPasswordData {
  userId: string;
  newPassword: string;
}

/**
 * Organization plugin types
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  user?: User;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  inviterId: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  expiresAt: Date;
  createdAt: Date;
  organization?: Organization;
  inviter?: Member;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  logo?: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrganizationData {
  organizationId?: string;
  data: {
    name?: string;
    slug?: string;
    logo?: string;
    metadata?: Record<string, any> | null;
  };
}

export interface InviteMemberData {
  email: string;
  role: string | string[];
  organizationId?: string;
  resend?: boolean;
}

export interface ListMembersQuery {
  organizationId?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  filterField?: string;
  filterOperator?: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
  filterValue?: string;
}

export interface UpdateMemberRoleData {
  memberId: string;
  role: string | string[];
  organizationId?: string;
}

export interface FullOrganization extends Organization {
  members: Member[];
}
