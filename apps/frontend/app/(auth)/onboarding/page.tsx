"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthNavbar } from "@/components/common/auth-navbar";
import { useAuth } from "@/lib/contexts/auth-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ProfileStep } from "@/components/forms/onboarding/profile-step";
import { CompanyStep } from "@/components/forms/onboarding/company-step";
import { TeamInviteStep } from "@/components/forms/onboarding/team-invite-step";
import { DoneStep } from "@/components/forms/onboarding/done-step";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Profile", "Company", "Invite Team", "Done"];

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const { steps } = useOnboarding();
  const router = useRouter();

  // Determine the initial step based on completed steps
  const getInitialStep = () => {
    if (!steps.profile) return 0;
    if (!steps.company) return 1;
    if (!steps.team) return 2;
    return 3;
  };

  const [currentStep, setCurrentStep] = useState<number>(getInitialStep);

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, 3));
  const handleSkip = () => setCurrentStep((s) => Math.min(s + 1, 3));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <AuthNavbar />

      <div className="flex flex-1 flex-col items-center px-4 py-8">
        {/* Step progress bar */}
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={label} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {index > 0 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1 transition-colors duration-300",
                          isCompleted ? "bg-primary" : "bg-muted",
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300",
                        isCompleted &&
                          "border-primary bg-primary text-primary-foreground",
                        isCurrent &&
                          "border-primary bg-background text-primary scale-110",
                        !isCompleted &&
                          !isCurrent &&
                          "border-muted-foreground/30 text-muted-foreground",
                      )}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    {index < STEP_LABELS.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1 transition-colors duration-300",
                          index < currentStep ? "bg-primary" : "bg-muted",
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium transition-colors",
                      isCurrent || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="w-full max-w-2xl">
          {currentStep === 0 && (
            <ProfileStep onNext={handleNext} onSkip={handleSkip} />
          )}
          {currentStep === 1 && (
            <CompanyStep onNext={handleNext} onSkip={handleSkip} />
          )}
          {currentStep === 2 && (
            <TeamInviteStep onNext={handleNext} onSkip={handleSkip} />
          )}
          {currentStep === 3 && <DoneStep />}
        </div>
      </div>
    </div>
  );
}
