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
    organizationClient({
      // Define additional Company fields for the organization schema
      // Note: address, contact, industry, companySize stored in metadata (built-in)
      schema: {
        organization: {
          additionalFields: {
            businessType: {
              type: "string",
            },
            taxId: {
              type: "string",
            },
            fiscalYearStart: {
              type: "string",
            },
            currency: {
              type: "string",
            },
            headerText: {
              type: "string",
            },
            isActive: {
              type: "boolean",
            },
          },
        },
      },
    }),
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
  useListOrganizations,
} = authClient;
