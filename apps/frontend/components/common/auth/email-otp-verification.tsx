"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/config/auth-client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface EmailOTPVerificationProps {
  email: string;
  type: "sign-in" | "email-verification" | "forget-password";
  onSuccess?: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export function EmailOTPVerification({
  email,
  type,
  onSuccess,
  onCancel,
  title,
  description,
}: EmailOTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultTitles = {
    "sign-in": "Sign In with OTP",
    "email-verification": "Verify Your Email",
    "forget-password": "Reset Password",
  };

  const defaultDescriptions = {
    "sign-in": `Enter the 6-digit code sent to ${email}`,
    "email-verification": `We've sent a verification code to ${email}`,
    "forget-password": `Enter the code sent to ${email} to reset your password`,
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      let result;

      switch (type) {
        case "sign-in":
          result = await authClient.signIn.emailOtp({ email, otp });
          break;
        case "email-verification":
          result = await authClient.emailOtp.verifyEmail({ email, otp });
          break;
        case "forget-password":
          // For password reset, we just verify the OTP
          result = await authClient.emailOtp.checkVerificationOtp({ email, otp, type });
          break;
      }

      if (result.error) {
        if (result.error.message?.includes("TOO_MANY_ATTEMPTS")) {
          setError("Too many attempts. Please request a new code.");
        } else {
          setError(result.error.message || "Invalid or expired code");
        }
      } else {
        toast.success("Verification successful!");
        onSuccess?.();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("OTP verification error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setOtp("");

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type,
      });

      if (result.error) {
        setError(result.error.message || "Failed to resend code");
      } else {
        toast.success("New code sent to your email");
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
      console.error("Resend OTP error:", err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title || defaultTitles[type]}</CardTitle>
        <CardDescription>
          {description || defaultDescriptions[type]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError(null);
            }}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          
          <p className="text-xs text-muted-foreground text-center">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-primary hover:underline disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend"}
            </button>
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleVerify}
          disabled={isVerifying || otp.length !== 6}
          className="flex-1"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
