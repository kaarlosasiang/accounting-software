"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { CreatePersonnel } from "@sas/validators";
import {
  createPersonnelSchema,
  OrgRole,
  type RoleDto,
  type RolePermissionMap,
} from "@sas/validators";

import {
  type PermissionMatrixValue,
  RolePermissionMatrix,
} from "@/components/forms/role-permission-matrix/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersService } from "@/lib/services/users.service";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AddPersonnelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles?: RoleDto[];
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_OVERRIDES: PermissionMatrixValue = { grants: [], revocations: [] };

const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  [OrgRole.owner]: "Owner",
  [OrgRole.admin]: "Admin",
  [OrgRole.accountant]: "Accountant",
  [OrgRole.staff]: "Staff",
  [OrgRole.viewer]: "Viewer",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AddPersonnelDialog({
  open,
  onOpenChange,
  roles = [],
  onSuccess,
}: AddPersonnelDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [overrides, setOverrides] =
    useState<PermissionMatrixValue>(EMPTY_OVERRIDES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePersonnel>({
    resolver: zodResolver(createPersonnelSchema) as any,
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      password: "",
      phone_number: "",
      username: "",
      orgRole: OrgRole.staff,
      grants: [],
      revocations: [],
    },
  });

  const handleClose = () => {
    form.reset();
    setStep(1);
    setOverrides(EMPTY_OVERRIDES);
    onOpenChange(false);
  };

  const handleNextStep = () => {
    // Validate step-1 fields before advancing
    form
      .trigger(["first_name", "last_name", "email", "password", "orgRole"])
      .then((valid) => {
        if (valid) setStep(2);
      });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const payload: CreatePersonnel = {
        ...values,
        grants: overrides.grants,
        revocations: overrides.revocations,
      };
      await usersService.createPersonnel(payload);
      toast.success(
        `${values.first_name} ${values.last_name} has been added successfully.`,
      );
      handleClose();
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add personnel";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  // Derive the base permissions for the RolePermissionMatrix from the selected orgRole name
  const orgRole = form.watch("orgRole");
  const basePermissions = (() => {
    const match = roles.find(
      (r) => r.name.toLowerCase() === orgRole?.toLowerCase(),
    );
    if (!match) return undefined;
    return Object.fromEntries(
      match.permissions.map((p) => [p.resource, p.actions]),
    ) as unknown as RolePermissionMap;
  })();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Personnel
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Creates an account immediately. You set the password — the user can log in right away without any email confirmation."
              : "Optionally fine-tune their permissions on top of the default role."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground -mt-1">
          <Badge variant={step === 1 ? "default" : "secondary"}>
            1 Profile
          </Badge>
          <ChevronRight className="h-3 w-3" />
          <Badge variant={step === 2 ? "default" : "secondary"}>
            2 Permissions
          </Badge>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-0">
            {/* ── Step 1: Profile ────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="dela Cruz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="middle_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="juan@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temporary Password *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Min 8 characters"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+63 912 345 6789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="orgRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisation Role *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(OrgRole).map((r) => (
                            <SelectItem key={r} value={r}>
                              {ORG_ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ── Step 2: Permissions ────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Override individual permissions on top of the{" "}
                  <span className="font-medium capitalize">{orgRole}</span> role
                  defaults. Leave empty to use the role&apos;s defaults.
                </p>
                <RolePermissionMatrix
                  mode="override"
                  value={overrides}
                  onChange={setOverrides}
                  basePermissions={basePermissions}
                />
              </div>
            )}

            {/* Footer buttons are outside the scrollable form area */}
          </form>
        </Form>

        <DialogFooter className="gap-2">
          {step === 1 ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleNextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit as any}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding…" : "Add Personnel"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
