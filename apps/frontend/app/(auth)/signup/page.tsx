import { AuthNavbar } from "@/components/common/auth-navbar";
import { SignupWithVerification } from "@/components/forms/register-form";

export default function SignupPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center pb-10">
      <AuthNavbar />
      <div className="w-full max-w-sm">
        <SignupWithVerification />
      </div>
    </div>
  );
}
