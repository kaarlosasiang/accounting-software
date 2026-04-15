"use client";

import { useCallback } from "react";
import { authClient } from "@/lib/config/auth-client";
import { useAuth } from "@/lib/contexts/auth-context";

export type OnboardingStep = "profile" | "company" | "team";

export interface OnboardingSteps {
  profile: boolean;
  company: boolean;
  team: boolean;
}

export interface UseOnboardingReturn {
  steps: OnboardingSteps;
  allComplete: boolean;
  onboardingComplete: boolean;
  markStepComplete: (step: OnboardingStep) => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

const STEP_FIELD_MAP: Record<OnboardingStep, string> = {
  profile: "profileSetupCompletedAt",
  company: "companySetupCompletedAt",
  team: "teamInviteCompletedAt",
};

export function useOnboarding(): UseOnboardingReturn {
  const { user, refetchSession } = useAuth();

  const steps: OnboardingSteps = {
    profile: !!(user as any)?.profileSetupCompletedAt,
    company: !!(user as any)?.companySetupCompletedAt,
    team: !!(user as any)?.teamInviteCompletedAt,
  };

  const allComplete = steps.profile && steps.company && steps.team;
  const onboardingComplete = !!(user as any)?.onboardingCompletedAt;

  const markStepComplete = useCallback(
    async (step: OnboardingStep) => {
      const field = STEP_FIELD_MAP[step];
      await (authClient as any).updateUser({
        [field]: new Date().toISOString(),
      });
      await refetchSession();
    },
    [refetchSession],
  );

  const markOnboardingComplete = useCallback(async () => {
    await (authClient as any).updateUser({
      onboardingCompletedAt: new Date().toISOString(),
    });
    await refetchSession();
  }, [refetchSession]);

  return {
    steps,
    allComplete,
    onboardingComplete,
    markStepComplete,
    markOnboardingComplete,
  };
}
