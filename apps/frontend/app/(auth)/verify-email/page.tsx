"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthNavbar } from "@/components/common/auth-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/config/auth-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !email) return;
    setIsLoading(true);
    try {
      const result = await (authClient as any).emailOtp.verifyEmail({
        email,
        otp: otp.trim(),
      });
      if (result?.error)
        throw new Error(result.error.message || "Invalid code");
      toast.success("Email verified!");
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await (authClient as any).emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      toast.success("New code sent — check your inbox");
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <AuthNavbar />
      <div className="flex flex-1 items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              Enter the 6-digit code we sent to{" "}
              <span className="font-medium text-foreground">
                {email || "your email"}
              </span>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? "Verifying…" : "Verify Email"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Didn&apos;t receive it?{" "}
              <button
                type="button"
                className="underline hover:text-foreground"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
