import { createAuthClient } from "better-auth/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
});

// Export hooks for easy use in components
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  useActiveOrganization,
} = authClient;

