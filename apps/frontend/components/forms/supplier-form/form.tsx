"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  supplierSchema,
  type Supplier as SupplierSchemaType,
} from "@sas/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { supplierService } from "@/lib/services/supplier.service";
import { toast } from "sonner";
import type {
  Address,
  SupplierForm,
  SupplierFormProps,
} from "@/lib/types/supplier";

export function SupplierForm({
  onSubmit,
  onCancel,
  initialData,
  submitButtonText = "Save Supplier",
  cancelButtonText = "Cancel",
}: SupplierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(
    initialData && "_id" in initialData && initialData._id,
  );

  const getDefaultValues = (): Partial<SupplierSchemaType> => {
    const defaultAddress = {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    };

    const baseData: Partial<SupplierSchemaType> = {
      supplierCode: undefined,
      supplierName: "Fresh Harvest Market",
      displayName: "Fresh Harvest",
      email: "orders@freshharvestmarket.ph",
      phone: "+63 2 8234 5678",
      website: "",
      address: {
        street: "Stall 42, Farmers Market",
        city: "Quezon City",
        state: "Metro Manila",
        zipCode: "1100",
        country: "Philippines",
      },
      taxId: "789-012-345-000",
      paymentTerms: "Net 15",
      openingBalance: 0,
      isActive: true,
      notes: "Main supplier for fresh vegetables, meat, and seafood",
    };

    if (initialData) {
      const address = initialData.address || baseData.address || defaultAddress;
      return {
        ...baseData,
        ...initialData,
        address,
      };
    }

    return baseData;
  };

  // The types on useForm are strict about required fields,
  // but react-hook-form works fine with partial defaultValues.
  // Cast getDefaultValues() as any to avoid the error.
  const form = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: getDefaultValues() as any,
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      const values = getDefaultValues();
      Object.keys(values).forEach((key) => {
        form.setValue(
          key as keyof SupplierForm,
          values[key as keyof SupplierForm] as any,
        );
      });
    }
  }, [initialData]);

  const handleSubmit = async (data: SupplierSchemaType) => {
    setIsSubmitting(true);
    try {
      const formData: any = {
        ...data,
      };

      // Check if we're updating an existing supplier (has _id in initialData)
      const supplierId =
        initialData && "_id" in initialData ? initialData._id : undefined;

      // Let backend auto-generate code for new suppliers
      if (!supplierId) {
        delete formData.supplierCode;
      }

      if (supplierId && typeof supplierId === "string") {
        // Update existing supplier
        const result = await supplierService.updateSupplier(
          supplierId,
          formData,
        );

        if (result.success) {
          toast.success("Supplier updated successfully");
          await onSubmit?.(data);
        } else {
          throw new Error(result.error || "Failed to update supplier");
        }
      } else {
        // Create new supplier
        const result = await supplierService.createSupplier(formData);

        if (result.success) {
          toast.success("Supplier created successfully");
          await onSubmit?.(data);
        } else {
          throw new Error(result.error || "Failed to create supplier");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save supplier. Please try again.";
      toast.error(message);
      console.error("Error saving supplier:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 px-4"
      >
        {/* Basic Information */}
        {isEditing && initialData?.supplierCode && (
          <div className="bg-muted/50 p-3 rounded-md border">
            <p className="text-sm text-muted-foreground mb-1">Supplier Code</p>
            <p className="font-medium font-mono">{initialData.supplierCode}</p>
          </div>
        )}

        {!isEditing && (
          <div className="bg-muted/50 p-3 rounded-md border">
            <p className="text-sm text-muted-foreground">
              Supplier code will be auto-generated when you create this
              supplier.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Supplier Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Manila Rice Trading Co."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Optional display name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="supplier@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Phone <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="+63 2 1234 5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://www.example.com"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Address</h3>
          <FormField
            control={form.control}
            name="address.street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Street <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="123 Main Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    City <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Manila" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    State <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Metro Manila" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Zip Code <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Country <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Philippines" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Business Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tax ID <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="123-456-789-000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Payment Terms <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Net 30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="openingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Balance</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about the supplier..."
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {field.value
                      ? "This supplier is active and available"
                      : "This supplier is inactive and hidden"}
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
