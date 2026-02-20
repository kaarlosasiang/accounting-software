"use client";

import { AuthNavbar } from "@/components/common/auth-navbar";
import { LoginForm } from "@/components/forms/login-form/form";
import { useGuestRoute } from "@/lib/auth/protected-route";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/contexts/auth-context";

export default function LoginPage() {
  const { isLoading } = useGuestRoute();
  const { user } = useAuth();

  // Show loader while checking auth or while redirect is in flight
  if (isLoading || user) {
    return (
      <div className="bg-background flex h-svh flex-col items-center justify-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-svh flex-col">
      <AuthNavbar />
      <div className="w-full h-full px-6 md:px-10 flex items-center justify-center">
        <LoginForm className="max-w-sm" />
      </div>
    </div>
  );
}
