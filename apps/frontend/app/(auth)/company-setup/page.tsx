"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { CompanySetupForm } from "@/components/forms/company-setup-form";
import { AuthNavbar } from "@/components/common/auth-navbar";

export default function CompanySetupPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center pb-10">
      <AuthNavbar />
      <div className="w-full max-w-2xl px-4 py-8">
        <CompanySetupForm userId={user.id} />
      </div>
    </div>
  );
}
