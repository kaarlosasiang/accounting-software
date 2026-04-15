"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { useSession } from "@/lib/config/auth-client";
import { subscriptionService } from "@/lib/services/subscription.service";

type SubscriptionData = {
  hasActiveSubscription: boolean;
  subscriptionPlan: string;
  subscriptionStatus: string;
};

export default function BillingSettingsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    subscriptionService
      .getSubscriptionStatus(userId)
      .then((res) => {
        if (res.success && res.data) {
          setSubscriptionData(res.data);
        }
      })
      .catch(() => {
        // silently fail — user may not have a subscription record yet
      })
      .finally(() => setIsLoading(false));
  }, [session?.user?.id]);

  const plan = subscriptionData?.subscriptionPlan ?? "Free";
  const status = subscriptionData?.subscriptionStatus ?? "inactive";
  const isActive = subscriptionData?.hasActiveSubscription ?? false;

  const planLabel =
    plan === "1" || plan === "professional"
      ? "Professional"
      : plan === "2" || plan === "enterprise"
        ? "Enterprise"
        : plan === "free"
          ? "Free"
          : plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <div className="flex flex-col gap-6 px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
          Billing Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionLoading || isLoading ? (
            <div className="p-4 border rounded-lg space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-5 w-16" />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">{planLabel} Plan</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full access to all accounting features
                </p>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive
                    ? "Active"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              {!isActive && (
                <Button variant="outline" size="sm">
                  Upgrade Plan
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Payment method management is not yet available. Please contact
              support to update your billing information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
