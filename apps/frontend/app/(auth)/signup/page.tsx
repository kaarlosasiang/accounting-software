"use client";

import { useSearchParams } from "next/navigation";
import { AuthNavbar } from "@/components/common/auth-navbar";
import { SignupWithVerification } from "@/components/forms/register-form";
import { Spinner } from "@/components/ui/spinner";
import { useGuestRoute } from "@/lib/auth/protected-route";
import { useAuth } from "@/lib/contexts/auth-context";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const { isLoading } = useGuestRoute({ redirectTo: callbackUrl });
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
    <div className="bg-background flex min-h-svh flex-col items-center pb-10">
      <AuthNavbar />
      <div className="w-full max-w-sm">
        <SignupWithVerification />
      </div>
    </div>
  );
}
