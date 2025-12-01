"use client";

import { useState } from "react";
import { SignupForm } from "./form";
import { EmailOTPVerification } from "@/components/common/auth/email-otp-verification";
import { useRouter } from "next/navigation";

export function SignupWithVerification() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  const handleRegistrationSuccess = (email: string) => {
    setRegisteredEmail(email);
    setStep("verify");
  };

  const handleVerificationSuccess = () => {
    router.push("/dashboard");
  };

  const handleCancelVerification = () => {
    setStep("register");
    setRegisteredEmail("");
  };

  if (step === "verify" && registeredEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <EmailOTPVerification
          email={registeredEmail}
          type="email-verification"
          onSuccess={handleVerificationSuccess}
          onCancel={handleCancelVerification}
        />
      </div>
    );
  }

  return <SignupForm onRegistrationSuccess={handleRegistrationSuccess} />;
}
