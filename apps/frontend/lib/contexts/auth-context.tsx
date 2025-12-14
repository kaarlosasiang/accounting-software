"use client";

import { createContext, useContext } from "react";
import type {
  Session,
  User,
  CreateUserData,
  ListUsersQuery,
  ListUsersResponse,
  BanUserData,
  UpdateUserData,
  SetRoleData,
  SetPasswordData,
  Organization,
  Member,
  Invitation,
  CreateOrganizationData,
  UpdateOrganizationData,
  InviteMemberData,
  ListMembersQuery,
  UpdateMemberRoleData,
  FullOrganization,
} from "@/lib/types/auth";

export interface AuthContextValue {
  // Session state
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;

  // Auth methods
  signIn: {
    email: (email: string, password: string) => Promise<any>;
    social: (provider: string, options?: any) => Promise<any>;
    emailOtp: (email: string, otp: string) => Promise<any>;
  };
  signUp: {
    email: (data: {
      email: string;
      password: string;
      name: string;
      username?: string;
      firstName?: string;
      middleName?: string;
      lastName?: string;
      phoneNumber?: string;
    }) => Promise<any>;
  };
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<any>;

  // Email verification
  emailVerification: {
    sendOtp: (email: string) => Promise<any>;
    verifyEmail: (email: string, otp: string) => Promise<any>;
  };

  // Admin methods
  admin: {
    createUser: (data: CreateUserData) => Promise<any>;
    listUsers: (query?: ListUsersQuery) => Promise<ListUsersResponse>;
    setRole: (data: SetRoleData) => Promise<any>;
    setUserPassword: (data: SetPasswordData) => Promise<any>;
    updateUser: (data: UpdateUserData) => Promise<any>;
    banUser: (data: BanUserData) => Promise<any>;
    unbanUser: (userId: string) => Promise<any>;
    listUserSessions: (userId: string) => Promise<any>;
    revokeUserSession: (sessionToken: string) => Promise<any>;
    revokeUserSessions: (userId: string) => Promise<any>;
    impersonateUser: (userId: string) => Promise<any>;
    stopImpersonating: () => Promise<any>;
    removeUser: (userId: string) => Promise<any>;
  };

  // Organization methods
  organization: {
    create: (data: CreateOrganizationData) => Promise<any>;
    list: () => Promise<any>;
    getFullOrganization: (organizationId?: string) => Promise<any>;
    update: (data: UpdateOrganizationData) => Promise<any>;
    delete: (organizationId: string) => Promise<any>;
    setActive: (organizationId: string | null) => Promise<any>;
    inviteMember: (data: InviteMemberData) => Promise<any>;
    acceptInvitation: (invitationId: string) => Promise<any>;
    rejectInvitation: (invitationId: string) => Promise<any>;
    cancelInvitation: (invitationId: string) => Promise<any>;
    listInvitations: (organizationId?: string) => Promise<any>;
    listUserInvitations: () => Promise<any>;
    listMembers: (query?: ListMembersQuery) => Promise<any>;
    removeMember: (memberIdOrEmail: string, organizationId?: string) => Promise<any>;
    updateMemberRole: (data: UpdateMemberRoleData) => Promise<any>;
    leave: (organizationId: string) => Promise<any>;
    getActiveMember: () => Promise<any>;
  };
  activeOrganization: Organization | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
