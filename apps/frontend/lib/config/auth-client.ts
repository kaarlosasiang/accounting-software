import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  oneTapClient,
  emailOTPClient,
  organizationClient,
} from "better-auth/client/plugins";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [
    organizationClient(),
    adminClient(),
    emailOTPClient(),
    ...(GOOGLE_CLIENT_ID
      ? [
          oneTapClient({
            clientId: GOOGLE_CLIENT_ID,
            autoSelect: false,
            cancelOnTapOutside: true,
            context: "signin",
          }),
        ]
      : []),
  ],
});

// Export hooks for easy use in components
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  useActiveOrganization,
} = authClient;

