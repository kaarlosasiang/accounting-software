"use client";

import { CompanySetupForm } from "@/components/forms/company-setup-form";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";

interface CompanyStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function CompanyStep({ onNext, onSkip }: CompanyStepProps) {
  const { markStepComplete } = useOnboarding();

  const handleSuccess = async () => {
    await markStepComplete("company");
    onNext();
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <CompanySetupForm onSuccess={handleSuccess} />
      <div className="flex justify-start">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
