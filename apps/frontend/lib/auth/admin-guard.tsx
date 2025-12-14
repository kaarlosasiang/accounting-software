"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/lib/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Component that protects admin-only content
 * Redirects non-admin users or shows a fallback
 */
export function AdminGuard({
  children,
  redirectTo,
  fallback,
}: AdminGuardProps) {
  const { isAdmin } = useAdmin();
  const { isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isAdmin, isLoading, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive">
        <AlertDescription>
          You do not have permission to access this content. Admin privileges
          are required.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component to protect admin pages
 * 
 * @example
 * ```tsx
 * export default withAdminGuard(AdminDashboard);
 * ```
 */
export function withAdminGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: React.ReactNode;
  }
) {
  return function AdminProtectedComponent(props: P) {
    return (
      <AdminGuard
        redirectTo={options?.redirectTo}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </AdminGuard>
    );
  };
}

/**
 * Hook to check admin access and optionally redirect
 * 
 * @example
 * ```tsx
 * function AdminPage() {
 *   const { isAdmin } = useAdminGuard({ redirectTo: "/dashboard" });
 *   // Component will redirect if not admin
 *   return <AdminContent />;
 * }
 * ```
 */
export function useAdminGuard(options?: { redirectTo?: string }) {
  const { isAdmin } = useAdmin();
  const { isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin && options?.redirectTo) {
      router.replace(options.redirectTo);
    }
  }, [isAdmin, isLoading, options?.redirectTo, router]);

  return { isAdmin, isLoading };
}
