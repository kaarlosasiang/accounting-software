"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/lib/contexts/auth-context";
import type { User, ListUsersResponse } from "@/lib/types/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Admin Dashboard Component - Example implementation
 * Demonstrates how to use the admin plugin methods
 */
export function AdminDashboard() {
  const { isAdmin, isImpersonated, impersonatorId, admin } = useAdmin();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin && !authLoading) {
      loadUsers();
    }
  }, [isAdmin, authLoading]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await admin.listUsers({
        query: {
          limit: 10,
          offset: 0,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      if ((result as any)?.data) {
        setUsers((result as any).data.users || []);
        setTotal((result as any).data.total || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      setError(null);
      await admin.banUser({
        userId,
        banReason: "Administrator action",
        banExpiresIn: 60 * 60 * 24 * 7, // 7 days
      });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      setError(null);
      await admin.unbanUser({ userId });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unban user");
    }
  };

  const handleSetRole = async (userId: string, role: "admin" | "user") => {
    try {
      setError(null);
      await admin.setRole({ userId, role });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set role");
    }
  };

  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You do not have permission to access the admin dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Impersonation Banner */}
      {isImpersonated && (
        <Alert>
          <AlertDescription>
            You are currently impersonating a user. Impersonator ID: {impersonatorId}
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={async () => {
                await admin.stopImpersonating();
                window.location.reload();
              }}
            >
              Stop Impersonating
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Manage users, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Current User:</strong> {currentUser?.name} ({currentUser?.email})
            </p>
            <p>
              <strong>Role:</strong> <Badge>{currentUser?.role}</Badge>
            </p>
            <p>
              <strong>Total Users:</strong> {total}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      {user.banned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                      {user.role && <Badge variant="secondary">{user.role}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.banReason && (
                      <p className="text-xs text-destructive">
                        Ban Reason: {user.banReason}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {user.banned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbanUser(user.id)}
                      >
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBanUser(user.id)}
                      >
                        Ban
                      </Button>
                    )}

                    {user.role !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetRole(user.id, "admin")}
                      >
                        Make Admin
                      </Button>
                    )}

                    {user.role === "admin" && user.id !== currentUser?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetRole(user.id, "user")}
                      >
                        Remove Admin
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await admin.impersonateUser({ userId: user.id });
                        window.location.reload();
                      }}
                    >
                      Impersonate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
