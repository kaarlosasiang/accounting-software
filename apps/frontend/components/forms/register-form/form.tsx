"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/auth-context";
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
import { Checkbox } from "@/components/ui/checkbox";
import { userRegistrationSchema } from "@rrd10-sas/validators";

type FormValues = z.infer<typeof userRegistrationSchema> & {
  companyId?: string;
  role?: string;
};
const defaultValues: FormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  username: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  rememberMe: true,
};

export function SignupForm({
  className,
  onRegistrationSuccess,
  ...props
}: React.ComponentProps<"div"> & {
  onRegistrationSuccess?: (email: string) => void;
}) {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues,
  });

  const onSubmit = async ({
    confirmPassword,
    ...values
  }: FormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      await signUp.email({
        ...values,
        companyId: values.companyId ?? "",
        role: values.role ?? "user",
      });
      toast.success("Account created! Please verify your email.");
      reset(defaultValues);

      // If callback provided, trigger email verification flow
      if (onRegistrationSuccess) {
        onRegistrationSuccess(values.email);
      } else {
        // Fallback: redirect to login
        router.push("/login");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create your account right now.";
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
                  alt={"AM FINTRASS Logo"}
                  width={100}
                  height={100}
                />
              </div>
              <span className="sr-only">AM FINTRASS</span>
            </Link>
            <h1 className="text-xl font-bold">Create your account</h1>
            <FieldDescription>
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </FieldDescription>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="firstName">First Name</FieldLabel>
              <Input
                id="firstName"
                placeholder="Jane"
                autoComplete="given-name"
                aria-invalid={!!errors.firstName}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="middleName">
                Middle Name (optional)
              </FieldLabel>
              <Input
                id="middleName"
                placeholder="Anne"
                autoComplete="additional-name"
                aria-invalid={!!errors.middleName}
                {...register("middleName")}
              />
              {errors.middleName && (
                <p className="text-sm text-destructive">
                  {errors.middleName.message}
                </p>
              )}
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                id="lastName"
                placeholder="Doe"
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </Field>
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
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              placeholder="rrd10-admin"
              autoComplete="username"
              aria-invalid={!!errors.username}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+57 000 000 0000"
              autoComplete="tel"
              aria-invalid={!!errors.phoneNumber}
              {...register("phoneNumber")}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">
                {errors.phoneNumber.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
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
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </Field>
          <Field>
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    id="rememberSignup"
                    checked={field.value}
                    onCheckedChange={(value) => field.onChange(Boolean(value))}
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              )}
            />
          </Field>
          <Field>
            <Button
              type="submit"
              className={"font-bold"}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
          </Field>
        </FieldGroup>
        {/* Social Login */}
          <AuthDivider />
          <GoogleSignInButton callbackURL="/dashboard" mode="signup" />
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
