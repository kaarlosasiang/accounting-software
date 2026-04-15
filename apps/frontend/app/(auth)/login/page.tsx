"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthNavbar } from "@/components/common/auth-navbar";
import { LoginForm } from "@/components/forms/login-form/form";
import { useGuestRoute } from "@/lib/auth/protected-route";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/contexts/auth-context";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const { isLoading } = useGuestRoute({ redirectTo: callbackUrl });
  const { user } = useAuth();

  // Show loader while checking auth, or while any logged-in user is being redirected
  // (verified → dashboard/plans, unverified → verify-email).
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex h-svh flex-col items-center justify-center gap-3">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
