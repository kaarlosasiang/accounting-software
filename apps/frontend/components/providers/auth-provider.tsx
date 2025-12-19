"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthContext, type AuthContextValue } from "@/lib/contexts/auth-context";
import { authClient, useSession } from "@/lib/config/auth-client";
import { signIn as signInService, signUp as signUpService } from "@/lib/services/auth.service";
import type { Session, User } from "@/lib/types/auth";
import type { LoginPayload, SignupPayload } from "@/lib/services/auth.service";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: sessionData, isPending, error: sessionError } = useSession();
  const [error, setError] = useState<Error | null>(null);

  console.log("[AuthProvider] useSession state:", { isPending, hasSessionData: !!sessionData, hasUser: !!sessionData?.user });

  // Update error state
  useEffect(() => {
    if (sessionError) {
      setError(sessionError as Error);
    }
  }, [sessionError]);

  // Derive session/user from useSession data - no race condition
  const session = sessionData?.session ?? null;
  const user = (sessionData?.user as User) ?? null;

  // Sign in methods
  const signInEmail = useCallback(
    async (payload: LoginPayload) => {
      try {
        setError(null);
        const result = await signInService(payload);
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
    async (data: SignupPayload) => {
      try {
        setError(null);
        const result = await signUpService(data);
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
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
