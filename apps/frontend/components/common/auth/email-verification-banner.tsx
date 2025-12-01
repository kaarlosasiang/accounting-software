"use client";

import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail } from "lucide-react";
import { authClient } from "@/lib/config/auth-client";
import { toast } from "sonner";
import { useEmailVerification } from "@/hooks/use-email-verification";

export function EmailVerificationBanner() {
  const { needsVerification, user } = useEmailVerification();
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!needsVerification || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: user.email,
        type: "email-verification",
      });

      if (result.error) {
        toast.error("Failed to send verification email");
      } else {
        toast.success("Verification email sent! Check your inbox.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Resend verification error:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertTitle className="text-yellow-900 dark:text-yellow-100">
        Email Verification Required
      </AlertTitle>
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Please verify your email address ({user?.email}) to access all features.
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendVerification}
              disabled={isResending}
              className="border-yellow-600 text-yellow-900 hover:bg-yellow-100 dark:border-yellow-400 dark:text-yellow-100 dark:hover:bg-yellow-900"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isResending ? "Sending..." : "Resend Email"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className="text-yellow-900 hover:bg-yellow-100 dark:text-yellow-100 dark:hover:bg-yellow-900"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
