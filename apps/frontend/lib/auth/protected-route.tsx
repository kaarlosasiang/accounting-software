"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";

/**
 * Higher-order component to protect routes that require authentication.
 * Redirects to login page if user is not authenticated.
 * Redirects to plans page if user is not subscribed.
 *
 * @example
 * ```tsx
 * export default withAuth(DashboardPage);
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    allowUnverified?: boolean;
    requireSubscription?: boolean;
  },
) {
  const {
    redirectTo = "/login",
    allowUnverified = true,
    requireSubscription = true,
  } = options || {};

  return function AuthenticatedComponent(props: P) {
    const { user, session, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      // console.log("[withAuth] effect check:", {
      //   isLoading,
      //   hasUser: !!user,
      //   hasActiveSubscription: user
      //     ? (user as any).hasActiveSubscription
      //     : undefined,
      //   requireSubscription,
      // });

      if (!isLoading && !user) {
        router.replace(redirectTo);
        return;
      }

      // Check if email verification is required
      if (!isLoading && user && !allowUnverified && !user.emailVerified) {
        router.replace("/verify-email");
        return;
      }

      // Check if subscription is required.
      // Invited members are covered by their org's subscription — allow through
      // if they have an active organization, even without a personal subscription.
      const hasOrgAccess = !!(session as any)?.activeOrganizationId;
      if (
        !isLoading &&
        user &&
        requireSubscription &&
        !(user as any).hasActiveSubscription &&
        !hasOrgAccess
      ) {
        router.replace("/plans");
        return;
      }

      // If authenticated but no active organization, send to company-setup.
      // Without an org, every API call returns a missing companyId error.
      if (
        !isLoading &&
        user &&
        !hasOrgAccess &&
        !pathname?.startsWith("/company-setup") &&
        !pathname?.startsWith("/plans")
      ) {
        router.replace("/company-setup");
        return;
      }
    }, [user, session, isLoading, router, requireSubscription, pathname]);

    // Show loading state while checking authentication
    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    // Don't render component if not authenticated
    if (!user) {
      return null;
    }

    // Don't render if email verification is required and not verified
    if (!allowUnverified && !user.emailVerified) {
      return null;
    }

    // Don't render if subscription is required and user is not subscribed
    // (org members are covered by the org owner's subscription)
    const hasOrgAccess = !!(session as any)?.activeOrganizationId;
    if (
      requireSubscription &&
      !(user as any).hasActiveSubscription &&
      !hasOrgAccess
    ) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Hook to protect routes that require authentication.
 * Use this in page components to redirect if not authenticated.
 *
 * @example
 * ```tsx
 * export default function DashboardPage() {
 *   useProtectedRoute();
 *   // ... rest of component
 * }
 * ```
 */
export function useProtectedRoute(options?: {
  redirectTo?: string;
  allowUnverified?: boolean;
  requireSubscription?: boolean;
}) {
  const {
    redirectTo = "/login",
    allowUnverified = true,
    requireSubscription = true,
  } = options || {};
  const { user, session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo);
      return;
    }

    // Check if email verification is required
    if (!isLoading && user && !allowUnverified && !user.emailVerified) {
      router.replace("/verify-email");
      return;
    }

    // Check if subscription is required (org members are covered by the org)
    const hasOrgAccess = !!(session as any)?.activeOrganizationId;
    if (
      !isLoading &&
      user &&
      requireSubscription &&
      !(user as any).hasActiveSubscription &&
      !hasOrgAccess
    ) {
      router.replace("/plans");
      return;
    }
  }, [
    user,
    session,
    isLoading,
    router,
    redirectTo,
    allowUnverified,
    requireSubscription,
  ]);

  return { user, isLoading };
}

/**
 * Hook to redirect authenticated users away from auth pages.
 * Use this in login/signup pages to redirect to dashboard if already logged in.
 * Only redirects if user is authenticated AND has an active subscription.
 *
 * @example
 * ```tsx
 * export default function LoginPage() {
 *   useGuestRoute();
 *   // ... rest of component
 * }
 * ```
 */
export function useGuestRoute(options?: { redirectTo?: string }) {
  const { redirectTo = "/dashboard" } = options || {};
  const { user, session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect fully verified users — an unverified user (just signed up)
    // must stay on the auth page so the OTP verification step can be shown.
    if (!isLoading && user && user.emailVerified) {
      const hasOrgAccess = !!(session as any)?.activeOrganizationId;
      if ((user as any).hasActiveSubscription || hasOrgAccess) {
        router.replace(redirectTo);
      } else {
        router.replace("/plans");
      }
    }

    // Unverified user trying to access a guest route (e.g. came back to login) —
    // send them to the verify-email page so they can complete verification.
    if (!isLoading && user && !user.emailVerified) {
      router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
    }
  }, [user, session, isLoading, router, redirectTo]);

  return { isLoading };
}
