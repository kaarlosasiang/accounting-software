"use client";

import { createContext, useContext } from "react";
import type { Session, User } from "@/lib/types/auth";
import type { LoginPayload, SignupPayload } from "@/lib/services/auth.service";

export interface AuthContextValue {
  // Session state
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;

  // Auth methods
  signIn: {
    email: (data: LoginPayload) => Promise<any>;
    social: (provider: string, options?: any) => Promise<any>;
    emailOtp: (email: string, otp: string) => Promise<any>;
  };
  
  signUp: {
    email: (data: SignupPayload) => Promise<any>;
  };
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<any>;

  // Email verification
  emailVerification: {
    sendOtp: (email: string) => Promise<any>;
    verifyEmail: (email: string, otp: string) => Promise<any>;
  };
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
