"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/lib/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { Resource, Action } from "@sas/validators";

interface PermissionGuardProps {
  resource: Resource;
  action: Action;
  children: React.ReactNode;
  /** If provided, redirect to this path instead of showing an alert */
  redirectTo?: string;
  /** Custom fallback UI when permission is denied */
  fallback?: React.ReactNode;
}

/**
 * Guards content behind a specific resource + action permission.
 * Shows a loading skeleton while permissions are resolving.
 * Redirects or shows a fallback when the user lacks the required permission.
 */
export function PermissionGuard({
  resource,
  action,
  children,
  redirectTo,
  fallback,
}: PermissionGuardProps) {
  const { can, isLoading } = usePermissions();
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();

  const allowed = can(resource, action);
  const resolving = isLoading || authLoading;

  useEffect(() => {
    if (!resolving && !allowed && redirectTo) {
      router.replace(redirectTo);
    }
  }, [resolving, allowed, redirectTo, router]);

  if (resolving) {
    return (
      <div className="space-y-2 p-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!allowed) {
    if (fallback) return <>{fallback}</>;

    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>
          You do not have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component version of PermissionGuard for wrapping page components.
 *
 * @example
 * export default withPermissionGuard(Resource.user, Action.read)(TeamPage);
 */
export function withPermissionGuard(
  resource: Resource,
  action: Action,
  options?: { redirectTo?: string; fallback?: React.ReactNode },
) {
  return function wrap<P extends object>(Component: React.ComponentType<P>) {
    return function PermissionProtectedPage(props: P) {
      return (
        <PermissionGuard
          resource={resource}
          action={action}
          redirectTo={options?.redirectTo}
          fallback={options?.fallback}
        >
          <Component {...props} />
        </PermissionGuard>
      );
    };
  };
}
