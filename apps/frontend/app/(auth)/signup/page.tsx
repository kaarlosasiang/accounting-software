"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthNavbar } from "@/components/common/auth-navbar";
import { SignupForm } from "@/components/forms/register-form/form";
import { EmailOTPVerification } from "@/components/common/auth/email-otp-verification";
import { Spinner } from "@/components/ui/spinner";
import { useGuestRoute } from "@/lib/auth/protected-route";
import { useAuth } from "@/lib/contexts/auth-context";

function SignupPageContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const oauthError = searchParams.get("error");
  const { isLoading } = useGuestRoute({ redirectTo: callbackUrl });
  const { user } = useAuth();
  const router = useRouter();

  // Lifted state — survives the isLoading flip that happens when the new
  // session is established after signUp.email() resolves.
  const [step, setStep] = useState<"register" | "verify">("register");
  const [pendingEmail, setPendingEmail] = useState("");

  const handleRegistrationSuccess = (email: string) => {
    setPendingEmail(email);
    setStep("verify");
  };

  const handleVerificationSuccess = () => {
    router.push("/onboarding");
  };

  const handleCancelVerification = () => {
    setStep("register");
    setPendingEmail("");
  };

  // Surface OAuth errors (e.g. state-mismatch) that Better Auth encodes as
  // ?error= on the callback redirect back to the frontend.
  useEffect(() => {
    if (oauthError) {
      const messages: Record<string, string> = {
        state_mismatch: "Sign-in was interrupted. Please try again.",
        account_not_found: "No account found. Please sign up first.",
        email_not_verified: "Please verify your email before continuing.",
      };
      toast.error(
        messages[oauthError] ?? "Google sign-in failed. Please try again.",
      );
      // Clean the error param from the URL without a full page reload
      const params = new URLSearchParams(searchParams.toString());
      params.delete("error");
      router.replace(`/signup?${params.toString()}`);
    }
  }, [oauthError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Verified user → useGuestRoute is redirecting, show spinner.
  if (user && user.emailVerified) {
    return (
      <div className="bg-background flex h-svh flex-col items-center justify-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  // Initial auth check — but don't show spinner once we're in the verify step
  // (isLoading briefly flips true when the session is created after signup).
  if (isLoading && step === "register") {
    return (
      <div className="bg-background flex h-svh flex-col items-center justify-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (step === "verify" && pendingEmail) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center pb-10">
        <AuthNavbar />
        <div className="flex flex-1 items-center justify-center p-6">
          <EmailOTPVerification
            email={pendingEmail}
            type="email-verification"
            onSuccess={handleVerificationSuccess}
            onCancel={handleCancelVerification}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center pb-10">
      <AuthNavbar />
      <div className="w-full max-w-sm">
        <SignupForm onRegistrationSuccess={handleRegistrationSuccess} />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex h-svh flex-col items-center justify-center gap-3">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
