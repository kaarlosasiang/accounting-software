"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { useOrganization } from "@/hooks/use-organization";
import { permissionsService } from "@/lib/services/permissions.service";
import type {
  BusinessType,
  CompanyAddress,
  CompanyContact,
  CompanyMetadata,
} from "@/lib/types/auth";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "sole proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "corporation", label: "Corporation" },
  { value: "non-profit", label: "Non-Profit" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
];

const CURRENCIES = [
  { value: "PESO", label: "PHP — Philippine Peso" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  // Step 1 — essentials
  companyName: z.string().min(2, "At least 2 characters"),
  companySlug: z
    .string()
    .min(3, "At least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  businessType: z.enum([
    "sole proprietorship",
    "partnership",
    "corporation",
    "non-profit",
    "government",
    "other",
  ]),
  currency: z.string().min(1, "Required"),

  // Step 2 — location
  address: z.string().min(5, "Required"),
  city: z.string().min(2, "Required"),
  state: z.string().optional(),
  country: z.string().min(2, "Required"),
  postalCode: z.string().min(2, "Required"),

  // Step 3 — contact (all optional)
  phone: z.string().optional(),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: ["companyName", "companySlug", "businessType", "currency"],
  2: ["address", "city", "country", "postalCode"],
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Basic" },
  { number: 2, label: "Location" },
  { number: 3, label: "Contact" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface NewOrgFormProps {
  onSuccess?: () => void;
}

export function NewOrgForm({ onSuccess }: NewOrgFormProps) {
  const { refetchSession } = useAuth();
  const { organization } = useOrganization();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      companySlug: "",
      businessType: "other",
      currency: "PESO",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      phone: "",
      email: "",
      website: "",
    },
  });

  const businessType = watch("businessType");
  const currency = watch("currency");

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const onSubmit = async (values: FormValues) => {
    if (step !== 3) return;
    if (!organization?.create) {
      toast.error("Organization service not available");
      return;
    }

    setIsSubmitting(true);
    try {
      const addressData: CompanyAddress[] = [
        {
          street: values.address,
          city: values.city,
          state: values.state || undefined,
          zipCode: values.postalCode,
          country: values.country,
        },
      ];

      const contactData: CompanyContact[] = [
        {
          phone: values.phone || undefined,
          email: values.email || undefined,
          website: values.website || undefined,
        },
      ];

      const metadata: CompanyMetadata = {
        address: addressData,
        contact: contactData,
      };

      const result = await organization.create({
        name: values.companyName,
        slug: values.companySlug,
        metadata,
        businessType: values.businessType,
        currency: values.currency,
        fiscalYearStart: new Date().toISOString(),
        headerText: values.companyName,
        isActive: true,
      });

      if (result?.error) {
        throw new Error(
          result.error.message || "Failed to create organization",
        );
      }
      if (!result?.data?.id) {
        throw new Error("Organization created but ID not returned");
      }

      const organizationId = result.data.id;
      await organization.setActive({ organizationId });

      try {
        await permissionsService.provisionMember(organizationId, "owner");
      } catch {
        // non-fatal
      }

      await refetchSession();
      toast.success("Organization created!");
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create organization",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = step > s.number;
          const active = step === s.number;
          return (
            <div
              key={s.number}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={cn(
                    "size-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                    done && "bg-primary text-primary-foreground",
                    active &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {s.number}
                </div>
                <span
                  className={cn(
                    "text-sm hidden sm:inline transition-colors",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-3 transition-colors",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
            e.preventDefault();
          }
        }}
      >
        {/* ── Step 1: Essentials ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="companyName" className="text-sm font-medium">
                  Company name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="companyName"
                  placeholder="Acme Corporation"
                  className={cn(errors.companyName && "border-destructive")}
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-xs text-destructive">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="companySlug" className="text-sm font-medium">
                  Slug <span className="text-destructive">*</span>
                </label>
                <Input
                  id="companySlug"
                  placeholder="acme-corp"
                  className={cn(errors.companySlug && "border-destructive")}
                  {...register("companySlug")}
                />
                {errors.companySlug ? (
                  <p className="text-xs text-destructive">
                    {errors.companySlug.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Lowercase, numbers &amp; hyphens only
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Business type <span className="text-destructive">*</span>
                </label>
                <Select
                  value={businessType}
                  onValueChange={(v) =>
                    setValue("businessType", v as BusinessType)
                  }
                >
                  <SelectTrigger
                    className={cn(errors.businessType && "border-destructive")}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessType && (
                  <p className="text-xs text-destructive">
                    {errors.businessType.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Currency <span className="text-destructive">*</span>
                </label>
                <Select
                  value={currency}
                  onValueChange={(v) => setValue("currency", v)}
                >
                  <SelectTrigger
                    className={cn(errors.currency && "border-destructive")}
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-xs text-destructive">
                    {errors.currency.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Location ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="address" className="text-sm font-medium">
                Street address <span className="text-destructive">*</span>
              </label>
              <Input
                id="address"
                placeholder="123 Main Street, Suite 100"
                className={cn(errors.address && "border-destructive")}
                {...register("address")}
              />
              {errors.address && (
                <p className="text-xs text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="city" className="text-sm font-medium">
                  City <span className="text-destructive">*</span>
                </label>
                <Input
                  id="city"
                  placeholder="Manila"
                  className={cn(errors.city && "border-destructive")}
                  {...register("city")}
                />
                {errors.city && (
                  <p className="text-xs text-destructive">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="state" className="text-sm font-medium">
                  State / Province
                </label>
                <Input
                  id="state"
                  placeholder="Optional"
                  {...register("state")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="country" className="text-sm font-medium">
                  Country <span className="text-destructive">*</span>
                </label>
                <Input
                  id="country"
                  placeholder="Philippines"
                  className={cn(errors.country && "border-destructive")}
                  {...register("country")}
                />
                {errors.country && (
                  <p className="text-xs text-destructive">
                    {errors.country.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="postalCode" className="text-sm font-medium">
                  Postal code <span className="text-destructive">*</span>
                </label>
                <Input
                  id="postalCode"
                  placeholder="1000"
                  className={cn(errors.postalCode && "border-destructive")}
                  {...register("postalCode")}
                />
                {errors.postalCode && (
                  <p className="text-xs text-destructive">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Contact (optional) ── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All fields are optional — you can add these later in settings.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+63 2 8123 4567"
                  {...register("phone")}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Company email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@company.com"
                  className={cn(errors.email && "border-destructive")}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="website" className="text-sm font-medium">
                Website
              </label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.company.com"
                className={cn(errors.website && "border-destructive")}
                {...register("website")}
              />
              {errors.website && (
                <p className="text-xs text-destructive">
                  {errors.website.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button type="button" onClick={handleNext} className="flex-1 group">
              Continue
              <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          ) : (
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create organization"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
