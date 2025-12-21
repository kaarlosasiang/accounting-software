"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, User, Building2, Shield, Calendar } from "lucide-react";

/**
 * Example component demonstrating how to use the auth context.
 * This shows user information and provides sign out functionality.
 * 
 * Usage: Add this component to any page to display user info.
 */
export function AuthStatusCard() {
  const { user, session, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
          <CardDescription>Please sign in to view your profile</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      // Optionally redirect or show a message
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Get user initials for avatar fallback
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={user.emailVerified ? "default" : "secondary"}>
            {user.emailVerified ? "Email Verified" : "Email Not Verified"}
          </Badge>
          {user.role && (
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              {user.role}
            </Badge>
          )}
        </div>

        <Separator />

        <div className="grid gap-3">
          <h3 className="text-sm font-semibold">Profile Information</h3>
          
          {user.first_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">First Name:</span>
              <span className="font-medium">{user.first_name}</span>
            </div>
          )}

          {user.middle_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Middle Name:</span>
              <span className="font-medium">{user.middle_name}</span>
            </div>
          )}

          {user.last_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Name:</span>
              <span className="font-medium">{user.last_name}</span>
            </div>
          )}

          {user.phone_number && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{user.phone_number}</span>
            </div>
          )}

          {user.username && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium">@{user.username}</span>
            </div>
          )}

          {user.companyId && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Company ID:</span>
              <span className="font-medium font-mono text-xs">{user.companyId}</span>
            </div>
          )}
        </div>

        {session && (
          <>
            <Separator />
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold">Session Information</h3>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {new Date(session.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-medium">
                  {new Date(session.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Session ID: {session.id.substring(0, 16)}...
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
