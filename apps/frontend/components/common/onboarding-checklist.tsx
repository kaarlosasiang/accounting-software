"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CHECKLIST_ITEMS = [
  {
    key: "profile" as const,
    label: "Complete your profile",
    description: "Add your name, username, and phone number",
  },
  {
    key: "company" as const,
    label: "Set up your company",
    description: "Enter company details, address, and currency",
  },
  {
    key: "team" as const,
    label: "Invite your team",
    description: "Add teammates so they can collaborate with you",
  },
];

export function OnboardingChecklist() {
  const { steps, onboardingComplete } = useOnboarding();

  // Hidden once fully completed
  if (onboardingComplete) return null;

  const completedCount = Object.values(steps).filter(Boolean).length;

  return (
    <Card
      className="border-primary/30 bg-primary/5"
      data-tour="onboarding-checklist"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Complete your setup</CardTitle>
            <CardDescription>
              {completedCount} of {CHECKLIST_ITEMS.length} steps done
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
            <Link href="/onboarding">
              Continue setup
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const done = steps[item.key];
          return (
            <div key={item.key} className="flex items-start gap-3">
              {done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p
                  className={cn(
                    "text-sm font-medium leading-none",
                    done && "text-muted-foreground line-through",
                  )}
                >
                  {item.label}
                </p>
                {!done && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
