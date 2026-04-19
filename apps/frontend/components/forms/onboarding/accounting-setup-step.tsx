"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, CalendarDays, CircleDollarSign } from "lucide-react";
import { useController, useForm } from "react-hook-form";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOnboarding } from "@/hooks/use-onboarding";
import { companySettingsService } from "@/lib/services/company-settings.service";

const FISCAL_YEAR_MONTHS = [
  { value: "01-31", label: "January" },
  { value: "02-28", label: "February" },
  { value: "03-31", label: "March" },
  { value: "04-30", label: "April" },
  { value: "05-31", label: "May" },
  { value: "06-30", label: "June" },
  { value: "07-31", label: "July" },
  { value: "08-31", label: "August" },
  { value: "09-30", label: "September" },
  { value: "10-31", label: "October" },
  { value: "11-30", label: "November" },
  { value: "12-31", label: "December" },
];

const accountingSetupSchema = z.object({
  accountingMethod: z.enum(["Accrual", "Cash"]),
  fiscalYearEnd: z.string().min(1, "Select a fiscal year end month"),
});

type AccountingSetupValues = z.infer<typeof accountingSetupSchema>;

interface AccountingSetupStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function AccountingSetupStep({
  onNext,
  onSkip,
}: AccountingSetupStepProps) {
  const { markStepComplete } = useOnboarding();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountingSetupValues>({
    resolver: zodResolver(accountingSetupSchema),
    defaultValues: {
      accountingMethod: "Accrual",
      fiscalYearEnd: "12-31",
    },
  });

  const { field: methodField } = useController({
    name: "accountingMethod",
    control,
  });

  const { field: fiscalField } = useController({
    name: "fiscalYearEnd",
    control,
  });

  const onSubmit = async (values: AccountingSetupValues) => {
    try {
      const result = await companySettingsService.updateAccountingSettings({
        accountingMethod: values.accountingMethod,
        fiscalYearEnd: values.fiscalYearEnd,
      });

      if (!result.success) {
        throw new Error(result.error ?? "Failed to save accounting settings");
      }

      await markStepComplete("accounting");
      toast.success("Accounting settings saved!");
      onNext();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save accounting settings",
      );
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <CardTitle>Accounting Setup</CardTitle>
        </div>
        <CardDescription>
          Configure your accounting method and fiscal year. These settings
          affect how your books are kept and when your financial year closes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            {/* Accounting Method */}
            <Field>
              <FieldLabel className="flex items-center gap-1.5 mb-3">
                <CircleDollarSign className="size-4 text-muted-foreground" />
                Accounting Method
              </FieldLabel>
              <RadioGroup
                value={methodField.value}
                onValueChange={methodField.onChange}
                className="grid gap-3 sm:grid-cols-2"
              >
                <label
                  htmlFor="accrual"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                >
                  <RadioGroupItem value="Accrual" id="accrual" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-none">Accrual</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Record income and expenses when they are earned or
                      incurred, regardless of when cash changes hands.{" "}
                      <span className="font-medium text-foreground">
                        Recommended for most businesses.
                      </span>
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="cash"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                >
                  <RadioGroupItem value="Cash" id="cash" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-none">Cash</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Record income and expenses only when cash is actually
                      received or paid. Simpler, suited for small businesses.
                    </p>
                  </div>
                </label>
              </RadioGroup>
              {errors.accountingMethod && (
                <p className="text-sm text-destructive">
                  {errors.accountingMethod.message}
                </p>
              )}
            </Field>

            {/* Fiscal Year End */}
            <Field>
              <FieldLabel
                htmlFor="fiscalYearEnd"
                className="flex items-center gap-1.5"
              >
                <CalendarDays className="size-4 text-muted-foreground" />
                Fiscal Year End Month
              </FieldLabel>
              <FieldDescription>
                The last month of your financial year. Most businesses end in
                December.
              </FieldDescription>
              <Select
                value={fiscalField.value}
                onValueChange={fiscalField.onChange}
              >
                <SelectTrigger id="fiscalYearEnd" className="mt-1.5">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_YEAR_MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fiscalYearEnd && (
                <p className="text-sm text-destructive">
                  {errors.fiscalYearEnd.message}
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
