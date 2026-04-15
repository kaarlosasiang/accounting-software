"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { CompanySetupForm } from "@/components/forms/company-setup-form";
import { AuthNavbar } from "@/components/common/auth-navbar";

export default function CompanySetupPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center">
        <div className="text-muted-foreground text-sm">
          Session not found. Please{" "}
          <a href="/login" className="underline">
            log in
          </a>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center pb-10">
      <AuthNavbar />
      <div className="w-full max-w-2xl px-4 py-8">
        <CompanySetupForm />
      </div>
    </div>
  );
}
