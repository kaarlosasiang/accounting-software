"use client";

import { CheckCircle2, LayoutDashboard, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useProductTour } from "@/hooks/use-product-tour";

export function DoneStep() {
  const router = useRouter();
  const { markOnboardingComplete, steps } = useOnboarding();
  const { startTour } = useProductTour();
  const [isNavigating, setIsNavigating] = useState(false);

  const completedCount = Object.values(steps).filter(Boolean).length;

  const handleGoToDashboard = async () => {
    setIsNavigating(true);
    try {
      await markOnboardingComplete();
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong, please try again.");
      setIsNavigating(false);
    }
  };

  const handleStartTour = async () => {
    setIsNavigating(true);
    try {
      await markOnboardingComplete();
      router.push("/dashboard");
      // Tour starts after navigation settles (handled in use-product-tour.ts)
      startTour();
    } catch {
      toast.error("Something went wrong, please try again.");
      setIsNavigating(false);
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
      <CardHeader className="items-center pb-4">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-9 text-primary" />
        </div>
        <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
        <CardDescription className="text-base">
          {completedCount === 4
            ? "You've completed all setup steps. Your accounting workspace is ready."
            : `You completed ${completedCount} of 4 setup steps. You can finish the rest anytime from your dashboard.`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Button
          className="w-full gap-2"
          onClick={handleStartTour}
          disabled={isNavigating}
        >
          <Rocket className="size-4" />
          Take a quick tour
        </Button>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoToDashboard}
          disabled={isNavigating}
        >
          <LayoutDashboard className="size-4" />
          {isNavigating ? "Redirecting…" : "Go to Dashboard"}
        </Button>
      </CardContent>
    </Card>
  );
}
