"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/hooks/use-onboarding";
import { authClient } from "@/lib/config/auth-client";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50),
  phoneNumber: z.string().min(7, "Enter a valid phone number"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Only lowercase letters, numbers, _ and - allowed"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function ProfileStep({ onNext, onSkip }: ProfileStepProps) {
  const { markStepComplete } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await (authClient as any).updateUser({
        name: `${values.firstName}${values.middleName ? ` ${values.middleName}` : ""} ${values.lastName}`,
        first_name: values.firstName,
        middle_name: values.middleName,
        last_name: values.lastName,
        phone_number: values.phoneNumber,
        username: values.username,
      });

      if (result?.error) {
        throw new Error(result.error.message ?? "Failed to update profile");
      }

      await markStepComplete("profile");
      toast.success("Profile saved!");
      onNext();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="size-5 text-primary" />
          <CardTitle>Your Profile</CardTitle>
        </div>
        <CardDescription>
          Tell us a bit about yourself so your teammates can identify you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="firstName"
                  placeholder="Jane"
                  autoComplete="given-name"
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
                  Middle Name{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  id="middleName"
                  placeholder="Anne"
                  autoComplete="additional-name"
                  {...register("middleName")}
                />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  autoComplete="family-name"
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
              <FieldLabel htmlFor="username">
                Username <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="username"
                placeholder="jane-doe"
                autoComplete="username"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="phoneNumber">
                Phone Number <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+63 912 345 6789"
                autoComplete="tel"
                {...register("phoneNumber")}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">
                  {errors.phoneNumber.message}
                </p>
              )}
            </Field>
          </FieldGroup>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save & Continue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
