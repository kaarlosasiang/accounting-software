"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

    // console.log("[withAuth] render:", {
    //   isLoading,
    //   hasUser: !!user,
    //   hasActiveSubscription: user ? (user as any).hasActiveSubscription : undefined,
    //   pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
    // });

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
        console.log("[withAuth] Redirecting to login");
        router.replace(redirectTo);
        return;
      }

      // Check if email verification is required
      if (!isLoading && user && !allowUnverified && !user.emailVerified) {
        console.log("[withAuth] Redirecting to verify-email");
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
        console.log(
          "[withAuth] User not subscribed, redirecting to plans. User data:",
          {
            id: user.id,
            email: user.email,
            hasActiveSubscription: (user as any).hasActiveSubscription,
            subscriptionStatus: (user as any).subscriptionStatus,
            subscriptionPlan: (user as any).subscriptionPlan,
            activeOrganizationId: (session as any)?.activeOrganizationId,
          },
        );
        router.replace("/plans");
        return;
      }
    }, [user, session, isLoading, router, requireSubscription]);

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

  console.log("[useGuestRoute] check:", { isLoading, hasUser: !!user });

  useEffect(() => {
    console.log("[useGuestRoute] effect:", { isLoading, hasUser: !!user });
    if (!isLoading && user) {
      const hasOrgAccess = !!(session as any)?.activeOrganizationId;
      if ((user as any).hasActiveSubscription || hasOrgAccess) {
        console.log(
          "[useGuestRoute] User has access, redirecting to dashboard",
        );
        router.replace(redirectTo);
      } else {
        console.log(
          "[useGuestRoute] User logged in but no subscription, redirecting to plans",
        );
        router.replace("/plans");
      }
    }
  }, [user, session, isLoading, router, redirectTo]);

  return { isLoading };
}
