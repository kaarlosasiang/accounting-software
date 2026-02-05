"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Save, Briefcase, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { inventoryItemSchema, type InventoryItem } from "@rrd10-sas/validators";
import { useAccounts } from "@/hooks/use-accounts";
import { inventoryService } from "@/lib/services/inventory.service";
import { toast } from "sonner";
import { z } from "zod";

// Service-specific schema
const serviceSchema = inventoryItemSchema.pick({
  sku: true,
  itemName: true,
  description: true,
  unit: true,
  sellingPrice: true,
  incomeAccountId: true,
  salesTaxEnabled: true,
  salesTaxRate: true,
  purchaseTaxRate: true,
  isActive: true,
}).extend({
  itemType: z.literal("Service"),
  category: z.literal("Service"),
  unit: z.enum(["service", "hour", "session"]),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  initialData?: Partial<InventoryItem>;
  submitButtonText?: string;
  cancelButtonText?: string;
}

export function ServiceForm({
  onSubmit,
  onCancel,
  initialData,
  submitButtonText = "Save Service",
  cancelButtonText = "Cancel",
}: ServiceFormProps) {
  const { accounts: revenueAccounts } = useAccounts("Revenue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemId, setItemId] = useState<string | undefined>(
    initialData && "_id" in initialData
      ? (initialData._id as string)
      : undefined,
  );

  const getDefaultValues = (): Partial<ServiceFormData> => {
    const baseData: Partial<ServiceFormData> = {
      itemType: "Service",
      sku: "",
      itemName: "",
      description: "",
      category: "Service",
      unit: "service",
      sellingPrice: 0,
      incomeAccountId: "",
      salesTaxEnabled: false,
      salesTaxRate: undefined,
      isActive: true,
    };

if (initialData) {
        return {
          ...baseData,
          sku: initialData.sku || "",
          itemName: initialData.itemName || "",
          description: initialData.description || "",
          unit: initialData.unit === "service" || initialData.unit === "hour" || initialData.unit === "session" 
            ? initialData.unit 
            : "service",
          sellingPrice: initialData.sellingPrice || 0,
          incomeAccountId: (initialData.incomeAccountId as any)?._id || initialData.incomeAccountId || "",
          salesTaxEnabled: initialData.salesTaxEnabled || false,
          salesTaxRate: initialData.salesTaxRate,
          purchaseTaxRate: initialData.purchaseTaxRate,
          isActive: initialData.isActive !== undefined ? initialData.isActive : true,
          itemType: "Service",
          category: "Service",
        };
      }

    return baseData;
  };

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: getDefaultValues() as ServiceFormData,
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      const values = getDefaultValues();
      Object.keys(values).forEach((key) => {
        form.setValue(
          key as keyof ServiceFormData,
          values[key as keyof ServiceFormData] as any,
        );
      });
      if ("_id" in initialData) {
        setItemId(initialData._id as string);
      }
    }
  }, [initialData]);

  const handleSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      let response;

      // Ensure it's a service and add required fields for InventoryItemForm
      const serviceData = {
        ...data,
        itemType: "Service" as const,
        category: "Service" as const,
        quantityOnHand: 0,
        reorderLevel: 0,
        unitCost: 0,
        quantityAsOfDate: new Date(),
        inventoryAccountId: "",
        cogsAccountId: "",
      };

      if (itemId) {
        // Update existing service
        response = await inventoryService.updateItem(
          itemId,
          serviceData,
        );
      } else {
        // Create new service
        response = await inventoryService.createItem(serviceData);
      }

      if (response.success) {
        toast.success(
          itemId
            ? "Service updated successfully"
            : "Service created successfully",
        );
        if (onSubmit) {
          onSubmit(response.data);
        }
      } else {
        throw new Error(response.error || "Failed to save service");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save service";
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Service Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Service Information</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Code/SKU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SVC-001"
                      {...field}
                      className="uppercase"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Catering Service" {...field} />
                  </FormControl>
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what this service includes..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measure</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="service">Per Service</SelectItem>
                      <SelectItem value="hour">Per Hour</SelectItem>
                      <SelectItem value="session">Per Session</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Service is available for sale
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Pricing */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Pricing</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Price *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">
                        ₱
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Price charged to customers</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incomeAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Income Account *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select income account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {revenueAccounts.length === 0 ? (
                        <SelectItem value="_empty" disabled>
                          No revenue accounts found
                        </SelectItem>
                      ) : (
                        revenueAccounts.map((account) => (
                          <SelectItem key={account._id} value={account._id}>
                            {account.accountCode} - {account.accountName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>Account to record revenue</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Tax Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tax Settings</h3>

          <FormField
            control={form.control}
            name="salesTaxEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Sales Tax</FormLabel>
                  <FormDescription>
                    Enable if this service is taxable
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("salesTaxEnabled") && (
            <FormField
              control={form.control}
              name="salesTaxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales Tax Rate (%)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pr-8"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            parseFloat(e.target.value) || undefined,
                          )
                        }
                        value={field.value || ""}
                      />
                      <span className="absolute right-3 top-2.5 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelButtonText}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
