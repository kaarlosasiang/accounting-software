"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useAccounts } from "@/hooks/use-accounts";
import { billService } from "@/lib/services/bill.service";

// Define the form schema locally to avoid type inference issues
const billLineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  amount: z.number().min(0, "Amount must be non-negative"),
  accountId: z.string().min(1, "Account is required"),
  inventoryItemId: z.string().optional(),
  taxRate: z.number().min(0).max(100),
});

const createBillSchema = z
  .object({
    supplierId: z.string().min(1, "Supplier is required"),
    billDate: z.date(),
    dueDate: z.date(),
    lineItems: z
      .array(billLineItemSchema)
      .min(1, "At least one line item is required"),
    taxRate: z.number().min(0).max(100),
    notes: z.string().optional(),
    status: z.enum(["Draft", "Open"]),
  })
  .refine((data) => data.dueDate >= data.billDate, {
    message: "Due date must be on or after bill date",
    path: ["dueDate"],
  });

type CreateBillInput = z.infer<typeof createBillSchema>;

interface BillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BillForm({ open, onOpenChange, onSuccess }: BillFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { suppliers, loading: loadingSuppliers } = useSuppliers();
  const { accounts, loading: loadingAccounts } = useAccounts();

  const form = useForm({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      supplierId: "",
      billDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      lineItems: [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          accountId: "",
          taxRate: 0,
        },
      ],
      taxRate: 0,
      notes: "",
      status: "Draft" as const,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  // Calculate line item amount when quantity or unit price changes
  const calculateLineItemAmount = (index: number) => {
    const quantity = form.watch(`lineItems.${index}.quantity`);
    const unitPrice = form.watch(`lineItems.${index}.unitPrice`);
    const amount = quantity * unitPrice;
    form.setValue(`lineItems.${index}.amount`, amount);
  };

  // Watch for changes in line items
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        name?.startsWith("lineItems.") &&
        (name.endsWith(".quantity") || name.endsWith(".unitPrice"))
      ) {
        const index = parseInt(name.split(".")[1]);
        calculateLineItemAmount(index);
      }
    });
    return () => {
      if (typeof subscription === "object" && "unsubscribe" in subscription) {
        (subscription as { unsubscribe: () => void }).unsubscribe();
      }
    };
  }, [form]);

  const expenseAccounts = accounts.filter(
    (account) =>
      account.accountType === "Expense" ||
      account.accountName.toLowerCase().includes("expense") ||
      account.accountName.toLowerCase().includes("purchase") ||
      account.accountName.toLowerCase().includes("cost"),
  );

  const calculateSubtotal = () => {
    const lineItems = form.watch("lineItems");
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = form.watch("taxRate") || 0;
    return (subtotal * taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const onSubmit = async (data: CreateBillInput) => {
    try {
      setIsSubmitting(true);
      const response = await billService.createBill(data);

      if (response.success) {
        toast.success("Bill created successfully");
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.error || "Failed to create bill");
      }
    } catch (error) {
      toast.error("Failed to create bill");
      console.error("Error creating bill:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-1/3 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Bill</SheetTitle>
          <SheetDescription>
            Record a bill from your supplier for purchases or expenses.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6 px-4 mb-4"
          >
            {/* Supplier and Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingSuppliers ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          suppliers.map((supplier) => (
                            <SelectItem key={supplier._id} value={supplier._id}>
                              {supplier.supplierName || supplier.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Open">Open</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="billDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Line Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      description: "",
                      quantity: 1,
                      unitPrice: 0,
                      amount: 0,
                      accountId: "",
                      taxRate: 0,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-4">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Item description"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.accountId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expense Account *</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {loadingAccounts ? (
                                      <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      </div>
                                    ) : (
                                      expenseAccounts.map((account) => (
                                        <SelectItem
                                          key={account._id}
                                          value={account._id}
                                        >
                                          {account.accountCode} -{" "}
                                          {account.accountName}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit Price *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      disabled
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="mt-8"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Tax and Totals */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">
                        ₱{calculateSubtotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({form.watch("taxRate") || 0}%):
                      </span>
                      <span className="font-medium">
                        ₱{calculateTax().toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₱{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or comments..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Bill
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
