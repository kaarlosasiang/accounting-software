"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/config/auth-client";
import { 
  Building2, 
  MapPin, 
  FileText, 
  Globe, 
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Real Estate",
  "Hospitality",
  "Transportation",
  "Consulting",
  "Media & Entertainment",
  "Non-Profit",
  "Other",
];

const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
];

const companySetupSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyId: z.string()
    .min(3, "Company ID must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  industry: z.string().min(1, "Please select an industry"),
  companySize: z.string().min(1, "Please select company size"),
  description: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  postalCode: z.string().min(2, "Postal code is required"),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof companySetupSchema>;

const defaultValues: FormValues = {
  companyName: "",
  companyId: "",
  industry: "",
  companySize: "",
  description: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  taxId: "",
  registrationNumber: "",
  website: "",
  phone: "",
  email: "",
};

interface CompanySetupFormProps {
  userId: string;
  onSuccess?: () => void;
  className?: string;
}

const STEPS = [
  { number: 1, title: "Basic Info", icon: Building2 },
  { number: 2, title: "Location", icon: MapPin },
  { number: 3, title: "Legal & Contact", icon: FileText },
];

export function CompanySetupForm({
  userId,
  onSuccess,
  className,
}: CompanySetupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(companySetupSchema),
    defaultValues,
  });

  const industry = watch("industry");
  const companySize = watch("companySize");

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ["companyName", "companyId", "industry", "companySize"];
    } else if (step === 2) {
      fieldsToValidate = ["address", "city", "country", "postalCode"];
    }
    
    if (fieldsToValidate.length > 0) {
      return await trigger(fieldsToValidate);
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      // Create company in database
      const companyResponse = await fetch(`${API_URL}/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...values,
        }),
      });

      if (!companyResponse.ok) {
        const errorData = await companyResponse.json();
        throw new Error(errorData.message || "Failed to create company");
      }

      const companyResult = await companyResponse.json();

      // Also store in localStorage for demo purposes
      localStorage.setItem(`company_${userId}`, JSON.stringify({
        ...values,
        userId,
        createdAt: new Date().toISOString(),
      }));

      // Refresh the session to get updated user data
      console.log("Fetching updated session...");
      await authClient.getSession();
      console.log("Session updated successfully");

      toast.success("Company setup completed successfully!");

      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to dashboard with updated session
        router.push("/dashboard");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to setup company. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      {/* Header */}
      <div className="mb-8 text-center space-y-3">
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-3 mb-4">
          <Building2 className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Setup Your Company</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Complete your company profile to unlock all features and start managing your finances
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            Step {currentStep} of 3
          </Badge>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            
            return (
              <div key={step.number} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={cn(
                    "size-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary scale-110 shadow-lg",
                    !isCompleted && !isCurrent && "border-muted-foreground/30"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors hidden sm:block",
                    (isCurrent || isCompleted) ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
        <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <CardTitle>Basic Information</CardTitle>
            </div>
            <CardDescription>
              Tell us about your company and what you do
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="companyName">
                Company Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="companyName"
                placeholder="e.g., Acme Corporation"
                className={cn(errors.companyName && "border-destructive")}
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  {errors.companyName.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="companyId">
                Company ID <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="companyId"
                placeholder="e.g., acme-corp"
                className={cn(errors.companyId && "border-destructive")}
                {...register("companyId")}
              />
              <FieldDescription>
                A unique identifier (lowercase, numbers, and hyphens only)
              </FieldDescription>
              {errors.companyId && (
                <p className="text-sm text-destructive">{errors.companyId.message}</p>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="industry">
                  Industry <span className="text-destructive">*</span>
                </FieldLabel>
                <Select value={industry} onValueChange={(value) => setValue("industry", value)}>
                  <SelectTrigger className={cn(errors.industry && "border-destructive")}>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-sm text-destructive">{errors.industry.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="companySize">
                  Company Size <span className="text-destructive">*</span>
                </FieldLabel>
                <Select value={companySize} onValueChange={(value) => setValue("companySize", value)}>
                  <SelectTrigger className={cn(errors.companySize && "border-destructive")}>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companySize && (
                  <p className="text-sm text-destructive">{errors.companySize.message}</p>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="description">Company Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="Brief description of your company and what you do..."
                rows={3}
                {...register("description")}
              />
              <FieldDescription>Optional but helps us serve you better</FieldDescription>
            </Field>
          </CardContent>
        </Card>
        )}

        {/* Step 2: Location Details */}
        {currentStep === 2 && (
        <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <CardTitle>Location Details</CardTitle>
            </div>
            <CardDescription>Where is your company located?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="address">
                Street Address <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="address"
                placeholder="e.g., 123 Main Street, Suite 100"
                className={cn(errors.address && "border-destructive")}
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="city">
                  City <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="city"
                  placeholder="e.g., New York"
                  className={cn(errors.city && "border-destructive")}
                  {...register("city")}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="state">State/Province</FieldLabel>
                <Input
                  id="state"
                  placeholder="e.g., NY"
                  {...register("state")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="country"
                  placeholder="e.g., United States"
                  className={cn(errors.country && "border-destructive")}
                  {...register("country")}
                />
                {errors.country && (
                  <p className="text-sm text-destructive">{errors.country.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="postalCode">
                  Postal Code <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="postalCode"
                  placeholder="e.g., 10001"
                  className={cn(errors.postalCode && "border-destructive")}
                  {...register("postalCode")}
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                )}
              </Field>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Step 3: Legal & Contact Information */}
        {currentStep === 3 && (
        <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <CardTitle>Legal & Contact Information</CardTitle>
            </div>
            <CardDescription>
              Optional details for official documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="taxId">Tax ID / EIN</FieldLabel>
                <Input
                  id="taxId"
                  placeholder="e.g., 12-3456789"
                  {...register("taxId")}
                />
                <FieldDescription>Tax identification number</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="registrationNumber">Registration Number</FieldLabel>
                <Input
                  id="registrationNumber"
                  placeholder="Business registration #"
                  {...register("registrationNumber")}
                />
                <FieldDescription>Company registration number</FieldDescription>
              </Field>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., +1 (555) 123-4567"
                  {...register("phone")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Company Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., info@company.com"
                  className={cn(errors.email && "border-destructive")}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="website">
                <Globe className="inline size-4 mr-1" />
                Website
              </FieldLabel>
              <Input
                id="website"
                type="url"
                placeholder="e.g., https://www.company.com"
                className={cn(errors.website && "border-destructive")}
                {...register("website")}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </Field>
          </CardContent>
        </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              Back
            </Button>
          )}
          
          {currentStep < 3 ? (
            <Button
              type="button"
              size="lg"
              onClick={handleNext}
              className="flex-1 group"
            >
              Continue
              <ArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              size="lg" 
              className="flex-1 group"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5 mr-2" />
                  Complete Setup
                  <ArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          )}
        </div>

        {currentStep === 3 && (
          <p className="text-center text-sm text-muted-foreground animate-in fade-in duration-700">
            By completing setup, you agree to our terms of service
          </p>
        )}
      </form>
    </div>
  );
}
