"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthContext, type AuthContextValue } from "@/lib/contexts/auth-context";
import { authClient, useSession, useActiveOrganization } from "@/lib/config/auth-client";
import type { Session, User, Organization } from "@/lib/types/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: sessionData, isPending, error: sessionError } = useSession();
  const { data: activeOrgData } = useActiveOrganization();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);

  // Update local state when session changes
  useEffect(() => {
    if (sessionData) {
      setSession(sessionData.session);
      // Cast user to extended User type with additional fields
      setUser(sessionData.user as User);
    } else {
      setSession(null);
      setUser(null);
    }
  }, [sessionData]);

  // Update active organization state
  useEffect(() => {
    if (activeOrgData) {
      setActiveOrganization(activeOrgData as Organization);
    } else {
      setActiveOrganization(null);
    }
  }, [activeOrgData]);

  // Update error state
  useEffect(() => {
    if (sessionError) {
      setError(sessionError as Error);
    }
  }, [sessionError]);

  // Sign in methods
  const signInEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        const result = await authClient.signIn.email({ email, password });
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  const signInSocial = useCallback(
    async (provider: string, options?: any) => {
      try {
        setError(null);
        const result = await authClient.signIn.social({
          provider,
          ...options,
        });
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  const signInEmailOtp = useCallback(
    async (email: string, otp: string) => {
      try {
        setError(null);
        const result = await authClient.signIn.emailOtp({ email, otp });
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  // Sign up method
  const signUpEmail = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      username?: string;
      firstName?: string;
      middleName?: string;
      lastName?: string;
      phoneNumber?: string;
    }) => {
      try {
        setError(null);
        // Create the base signup data
        const signUpData: any = {
          email: data.email,
          password: data.password,
          name: data.name,
          callbackURL: "/dashboard",
        };
        
        // Add additional user fields if they're supported by your backend
        // These fields are defined in your Better Auth configuration
        if (data.username) signUpData.username = data.username;
        if (data.firstName) signUpData.first_name = data.firstName;
        if (data.middleName) signUpData.middle_name = data.middleName;
        if (data.lastName) signUpData.last_name = data.lastName;
        if (data.phoneNumber) signUpData.phone_number = data.phoneNumber;
        
        const result = await authClient.signUp.email(signUpData);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  // Sign out method
  const signOutUser = useCallback(async () => {
    try {
      setError(null);
      await authClient.signOut();
      setSession(null);
      setUser(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Update user method
  const updateUserData = useCallback(
    async (data: Partial<User>) => {
      try {
        setError(null);
        const result = await authClient.updateUser(data);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  // Email verification methods
  const sendVerificationOtp = useCallback(
    async (email: string) => {
      try {
        setError(null);
        const result = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification",
        });
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  const verifyEmail = useCallback(
    async (email: string, otp: string) => {
      try {
        setError(null);
        const result = await authClient.emailOtp.verifyEmail({ email, otp });
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  // Admin methods
  const adminCreateUser = useCallback(async (data: any) => {
    try {
      setError(null);
      const result = await authClient.admin.createUser(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminListUsers = useCallback(async (query?: any) => {
    try {
      setError(null);
      const result = await authClient.admin.listUsers({ query });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminSetRole = useCallback(async (data: any) => {
    try {
      setError(null);
      const result = await authClient.admin.setRole(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminSetUserPassword = useCallback(async (data: any) => {
    try {
      setError(null);
      const result = await authClient.admin.setUserPassword(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminUpdateUser = useCallback(async (data: any) => {
    try {
      setError(null);
      const result = await authClient.admin.updateUser(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminBanUser = useCallback(async (data: any) => {
    try {
      setError(null);
      const result = await authClient.admin.banUser(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminUnbanUser = useCallback(async (userId: string) => {
    try {
      setError(null);
      const result = await authClient.admin.unbanUser({ userId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminListUserSessions = useCallback(async (userId: string) => {
    try {
      setError(null);
      const result = await authClient.admin.listUserSessions({ userId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminRevokeUserSession = useCallback(async (sessionToken: string) => {
    try {
      setError(null);
      const result = await authClient.admin.revokeUserSession({ sessionToken });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminRevokeUserSessions = useCallback(async (userId: string) => {
    try {
      setError(null);
      const result = await authClient.admin.revokeUserSessions({ userId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminImpersonateUser = useCallback(async (userId: string) => {
    try {
      setError(null);
      const result = await authClient.admin.impersonateUser({ userId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminStopImpersonating = useCallback(async () => {
    try {
      setError(null);
      const result = await authClient.admin.stopImpersonating();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const adminRemoveUser = useCallback(async (userId: string) => {
    try {
      setError(null);
      const result = await authClient.admin.removeUser({ userId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Organization methods
  const orgCreate = useCallback(async (data: any) => {
    try {
      setError(null);
      const result = await authClient.organization.create(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgList = useCallback(async () => {
    try {
      setError(null);
      const result = await authClient.organization.list();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgGetFullOrganization = useCallback(async (organizationId?: string) => {
    try {
      setError(null);
      const result = await authClient.organization.getFullOrganization({
        query: { organizationId },
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgUpdate = useCallback(async (data: any) => {
    try {
      setError(null);
      const result = await authClient.organization.update(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgDelete = useCallback(async (organizationId: string) => {
    try {
      setError(null);
      const result = await authClient.organization.delete({ organizationId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgSetActive = useCallback(async (organizationId: string | null) => {
    try {
      setError(null);
      const result = await authClient.organization.setActive({ organizationId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgInviteMember = useCallback(async (data: any) => {
    try {
      setError(null);
      const result = await authClient.organization.inviteMember(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgAcceptInvitation = useCallback(async (invitationId: string) => {
    try {
      setError(null);
      const result = await authClient.organization.acceptInvitation({ invitationId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgRejectInvitation = useCallback(async (invitationId: string) => {
    try {
      setError(null);
      const result = await authClient.organization.rejectInvitation({ invitationId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgCancelInvitation = useCallback(async (invitationId: string) => {
    try {
      setError(null);
      const result = await authClient.organization.cancelInvitation({ invitationId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgListInvitations = useCallback(async (organizationId?: string) => {
    try {
      setError(null);
      const result = await authClient.organization.listInvitations({
        query: { organizationId },
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgListUserInvitations = useCallback(async () => {
    try {
      setError(null);
      const result = await authClient.organization.listUserInvitations();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgListMembers = useCallback(async (query?: any) => {
    try {
      setError(null);
      const result = await authClient.organization.listMembers({ query });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgRemoveMember = useCallback(
    async (memberIdOrEmail: string, organizationId?: string) => {
      try {
        setError(null);
        const result = await authClient.organization.removeMember({
          memberIdOrEmail,
          organizationId,
        });
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  const orgUpdateMemberRole = useCallback(async (data: any) => {
    try {
      setError(null);
      const result = await authClient.organization.updateMemberRole(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgLeave = useCallback(async (organizationId: string) => {
    try {
      setError(null);
      const result = await authClient.organization.leave({ organizationId });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const orgGetActiveMember = useCallback(async () => {
    try {
      setError(null);
      const result = await authClient.organization.getActiveMember();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const contextValue: AuthContextValue = {
    session,
    user,
    isLoading: isPending,
    error,
    signIn: {
      email: signInEmail,
      social: signInSocial,
      emailOtp: signInEmailOtp,
    },
    signUp: {
      email: signUpEmail,
    },
    signOut: signOutUser,
    updateUser: updateUserData,
    emailVerification: {
      sendOtp: sendVerificationOtp,
      verifyEmail: verifyEmail,
    },
    admin: {
      createUser: adminCreateUser,
      listUsers: adminListUsers,
      setRole: adminSetRole,
      setUserPassword: adminSetUserPassword,
      updateUser: adminUpdateUser,
      banUser: adminBanUser,
      unbanUser: adminUnbanUser,
      listUserSessions: adminListUserSessions,
      revokeUserSession: adminRevokeUserSession,
      revokeUserSessions: adminRevokeUserSessions,
      impersonateUser: adminImpersonateUser,
      stopImpersonating: adminStopImpersonating,
      removeUser: adminRemoveUser,
    },
    organization: {
      create: orgCreate,
      list: orgList,
      getFullOrganization: orgGetFullOrganization,
      update: orgUpdate,
      delete: orgDelete,
      setActive: orgSetActive,
      inviteMember: orgInviteMember,
      acceptInvitation: orgAcceptInvitation,
      rejectInvitation: orgRejectInvitation,
      cancelInvitation: orgCancelInvitation,
      listInvitations: orgListInvitations,
      listUserInvitations: orgListUserInvitations,
      listMembers: orgListMembers,
      removeMember: orgRemoveMember,
      updateMemberRole: orgUpdateMemberRole,
      leave: orgLeave,
      getActiveMember: orgGetActiveMember,
    },
    activeOrganization,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
