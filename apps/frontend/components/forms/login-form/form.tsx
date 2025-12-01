"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import z from "zod";
import { userLoginSchema } from "@rrd10-sas/validators";

import { cn } from "@/lib/utils";
import { signIn } from "@/lib/services/AuthService";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/common/auth/google-signin-button";
import { AuthDivider } from "@/components/common/auth/auth-divider";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/config/auth-client";

type FormValues = z.infer<typeof userLoginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(userLoginSchema),
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await signIn(values);
      toast.success("Welcome back! You are now signed in.");
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in right now.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex items-center justify-center rounded-md">
                <Image
                  src={"/am-fintrass-icon.png"}
                  alt={"Am Fintrass Logo"}
                  width={100}
                  height={100}
                />
              </div>
              <span className="sr-only">Am Fintrass</span>
            </Link>
            <h1 className="text-xl font-semibold">
              Welcome to <span className="text-primary font-bold">AM</span>{" "}
              <span className="text-zinc-700 font-bold">FINTRASS</span>
            </h1>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </Field>
          <Field>
            <Button type="submit" className="font-bold" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Log In"}
            </Button>
            <FieldDescription className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
        {/* Social Login */}
        <AuthDivider />
        <GoogleSignInButton callbackURL="/dashboard" mode="signin" />
      </form>
      <FieldDescription className="px-6 text-center text-sm">
        By clicking continue, you agree to our{" "}
        <Link href="/legal/terms" className="underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
