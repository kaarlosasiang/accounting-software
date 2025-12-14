"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";

/**
 * Higher-order component to protect routes that require authentication.
 * Redirects to login page if user is not authenticated.
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
  }
) {
  const { redirectTo = "/login", allowUnverified = true } = options || {};

  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) {
        router.replace(redirectTo);
      }

      // Check if email verification is required
      if (
        !isLoading &&
        user &&
        !allowUnverified &&
        !user.emailVerified
      ) {
        router.replace("/verify-email");
      }
    }, [user, isLoading, router]);

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
}) {
  const { redirectTo = "/login", allowUnverified = true } = options || {};
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo);
    }

    // Check if email verification is required
    if (!isLoading && user && !allowUnverified && !user.emailVerified) {
      router.replace("/verify-email");
    }
  }, [user, isLoading, router, redirectTo, allowUnverified]);

  return { user, isLoading };
}

/**
 * Hook to redirect authenticated users away from auth pages.
 * Use this in login/signup pages to redirect to dashboard if already logged in.
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
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { isLoading };
}
