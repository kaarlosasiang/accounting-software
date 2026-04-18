"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOnboarding } from "@/hooks/use-onboarding";
import { authClient } from "@/lib/config/auth-client";

const teamInviteSchema = z.object({
  invites: z
    .array(
      z.object({
        email: z.string().email("Enter a valid email"),
        role: z.string().min(1, "Select a role"),
      }),
    )
    .min(1, "Add at least one invite"),
});

type TeamInviteFormValues = z.infer<typeof teamInviteSchema>;

const ROLES = [
  { value: "accountant", label: "Accountant" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
  { value: "admin", label: "Admin" },
];

interface TeamInviteStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function TeamInviteStep({ onNext, onSkip }: TeamInviteStepProps) {
  const { markStepComplete } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TeamInviteFormValues>({
    resolver: zodResolver(teamInviteSchema),
    defaultValues: { invites: [{ email: "", role: "staff" }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invites",
  });

  const invites = watch("invites");

  const onSubmit = async (values: TeamInviteFormValues) => {
    setIsSubmitting(true);
    const errors: string[] = [];

    try {
      for (const invite of values.invites) {
        const result = await authClient.organization.inviteMember({
          email: invite.email,
          role: invite.role as "admin" | "member" | "owner",
        });
        if (result?.error) {
          errors.push(`${invite.email}: ${result.error.message}`);
        }
      }

      if (errors.length > 0) {
        errors.forEach((e) => toast.error(e));
        return;
      }

      await markStepComplete("team");
      toast.success(
        `${values.invites.length} invitation${values.invites.length > 1 ? "s" : ""} sent!`,
      );
      onNext();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invites",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <CardTitle>Invite Your Team</CardTitle>
        </div>
        <CardDescription>
          Add teammates so they can collaborate with you in the app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Field className="flex-1">
                  {index === 0 && (
                    <FieldLabel htmlFor={`invites.${index}.email`}>
                      Email
                    </FieldLabel>
                  )}
                  <Input
                    id={`invites.${index}.email`}
                    type="email"
                    placeholder="colleague@company.com"
                    {...register(`invites.${index}.email`)}
                  />
                  {errors.invites?.[index]?.email && (
                    <p className="text-sm text-destructive">
                      {errors.invites[index]?.email?.message}
                    </p>
                  )}
                </Field>

                <Field className="w-36">
                  {index === 0 && <FieldLabel>Role</FieldLabel>}
                  <Select
                    value={invites[index]?.role ?? "staff"}
                    onValueChange={(value) =>
                      setValue(`invites.${index}.role`, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={index === 0 ? "mt-6" : ""}
                    onClick={() => remove(index)}
                    aria-label="Remove invite"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => append({ email: "", role: "staff" })}
            >
              <Plus className="size-4" />
              Add another
            </Button>
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
              {isSubmitting ? "Sending…" : "Send Invites"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
