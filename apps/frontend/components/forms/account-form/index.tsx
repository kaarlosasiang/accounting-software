"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { accountsService, type Account } from "@/lib/services/accounts.service";
import { Loader2 } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";

const accountFormSchema = z.object({
  accountCode: z
    .string()
    .min(1, "Account code is required")
    .regex(/^\d+$/, "Account code must be numeric (e.g., '1000', '2000')"),
  accountName: z
    .string()
    .min(1, "Account name is required")
    .max(100, "Account name cannot exceed 100 characters"),
  accountType: z.enum(["Asset", "Liability", "Equity", "Revenue", "Expense"]),
  subType: z.string().max(100).optional(),
  normalBalance: z.enum(["Debit", "Credit"]),
  parentAccount: z.string().optional(),
  description: z.string().max(500).optional(),
  balance: z.number(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
  initialData?: Account;
  isEdit?: boolean;
}

export function AccountForm({ initialData, isEdit = false }: AccountFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accounts } = useAccounts();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountCode: initialData?.accountCode || "",
      accountName: initialData?.accountName || "",
      accountType: initialData?.accountType || "Asset",
      subType: initialData?.subType || "",
      normalBalance: initialData?.normalBalance || "Debit",
      parentAccount: initialData?.parentAccount || "",
      description: initialData?.description || "",
      balance: initialData?.balance || 0,
    },
  });

  const selectedAccountType = form.watch("accountType");

  // Auto-set normal balance based on account type
  const handleAccountTypeChange = (value: AccountFormValues["accountType"]) => {
    form.setValue("accountType", value);

    // Set default normal balance based on account type
    if (value === "Asset" || value === "Expense") {
      form.setValue("normalBalance", "Debit");
    } else if (
      value === "Liability" ||
      value === "Equity" ||
      value === "Revenue"
    ) {
      form.setValue("normalBalance", "Credit");
    }
  };

  // Filter parent accounts by the same type
  const parentAccountOptions = accounts.filter(
    (account) =>
      account.accountType === selectedAccountType &&
      account._id !== initialData?._id, // Don't allow self as parent
  );

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);

    try {
      const result =
        isEdit && initialData?._id
          ? await accountsService.updateAccount(initialData._id, data)
          : await accountsService.createAccount(data);

      if (result.success) {
        toast.success(`Account ${isEdit ? "updated" : "created"} successfully`);
        router.push("/accounts");
        router.refresh();
      } else {
        toast.error(
          result.error || `Failed to ${isEdit ? "update" : "create"} account`,
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${isEdit ? "update" : "create"} account`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="accountCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 1000"
                    {...field}
                    disabled={isEdit} // Don't allow changing code in edit mode
                  />
                </FormControl>
                <FormDescription>
                  Numeric code for the account (e.g., 1000 for Cash)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Cash on Hand" {...field} />
                </FormControl>
                <FormDescription>
                  Descriptive name for the account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <Select
                  onValueChange={handleAccountTypeChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Asset">Asset</SelectItem>
                    <SelectItem value="Liability">Liability</SelectItem>
                    <SelectItem value="Equity">Equity</SelectItem>
                    <SelectItem value="Revenue">Revenue</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Primary classification of the account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="normalBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Normal Balance</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select normal balance" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Debit">Debit</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Whether the account increases with debits or credits
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub Type (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Current Asset, Fixed Asset"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Additional classification within the account type
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentAccount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Account (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None - Top level account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {parentAccountOptions.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.accountCode} - {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Create a sub-account under an existing account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a description for this account..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Additional details about this account
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEdit && (
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Balance (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value || 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Starting balance for this account (defaults to 0)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Account" : "Create Account"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
