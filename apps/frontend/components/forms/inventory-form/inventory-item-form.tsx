"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Info, Save, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { inventoryItemSchema, type InventoryItem } from "@rrd10-sas/validators";
import { useAccounts } from "@/hooks/use-accounts";
import { inventoryService } from "@/lib/services/inventory.service";
import { toast } from "sonner";
import type {
  InventoryItemForm,
  InventoryItemFormProps,
} from "@/lib/types/inventory";
import { z } from "zod";

export function InventoryItemForm({
  onSubmit,
  onCancel,
  initialData,
  submitButtonText = "Save Item",
  cancelButtonText = "Cancel",
}: InventoryItemFormProps) {
  const { accounts: assetAccounts } = useAccounts("Asset");
  const { accounts: expenseAccounts } = useAccounts("Expense");
  const { accounts: revenueAccounts } = useAccounts("Revenue");

  // Helper to convert date string or Date to Date object
  const parseDate = (date: Date | string | undefined): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    return new Date(date);
  };

  const getDefaultValues = (): InventoryItem => {
    const baseData: InventoryItem = {
      sku: "",
      itemName: "",
      description: "",
      category: "Food",
      unit: "pcs",
      quantityOnHand: 0,
      quantityAsOfDate: new Date(),
      reorderLevel: 0,
      unitCost: 0,
      sellingPrice: 0,
      inventoryAccountId: "",
      cogsAccountId: "",
      incomeAccountId: "",
      supplierId: undefined,
      salesTaxEnabled: false,
      salesTaxRate: undefined,
      purchaseTaxRate: undefined,
      isActive: true,
    };

    if (initialData) {
      return {
        ...baseData,
        ...initialData,
        // Ensure required fields are always present
        sku: initialData.sku ?? baseData.sku,
        itemName: initialData.itemName ?? baseData.itemName,
        category: initialData.category ?? baseData.category,
        unit: initialData.unit ?? baseData.unit,
        quantityOnHand: initialData.quantityOnHand ?? baseData.quantityOnHand,
        quantityAsOfDate: initialData.quantityAsOfDate
          ? parseDate(initialData.quantityAsOfDate as Date | string)
          : baseData.quantityAsOfDate,
        reorderLevel: initialData.reorderLevel ?? baseData.reorderLevel,
        unitCost: initialData.unitCost ?? baseData.unitCost,
        sellingPrice: initialData.sellingPrice ?? baseData.sellingPrice,
        inventoryAccountId:
          initialData.inventoryAccountId ?? baseData.inventoryAccountId,
        cogsAccountId: initialData.cogsAccountId ?? baseData.cogsAccountId,
        incomeAccountId:
          initialData.incomeAccountId ?? baseData.incomeAccountId,
        isActive: initialData.isActive ?? baseData.isActive,
        salesTaxEnabled:
          initialData.salesTaxEnabled ?? baseData.salesTaxEnabled,
      };
    }

    return baseData;
  };

  const form = useForm({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: getDefaultValues(),
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      const values = getDefaultValues();
      Object.keys(values).forEach((key) => {
        form.setValue(
          key as keyof InventoryItem,
          values[key as keyof InventoryItem] as any
        );
      });
    }
  }, [initialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch form values for computed fields
  const sellingPrice = form.watch("sellingPrice");
  const unitCost = form.watch("unitCost");
  const quantityOnHand = form.watch("quantityOnHand");
  const salesTaxEnabled = form.watch("salesTaxEnabled");

  const profitMargin =
    sellingPrice > 0
      ? (((sellingPrice - unitCost) / sellingPrice) * 100).toFixed(2)
      : "0.00";

  const totalValue = formatCurrency(quantityOnHand * unitCost);

  const handleSubmit = async (data: InventoryItem) => {
    setIsSubmitting(true);
    try {
      // Check if we're updating an existing item (has _id in initialData)
      const itemId =
        initialData && "_id" in initialData ? initialData._id : undefined;

      if (itemId && typeof itemId === "string") {
        // Update existing item
        const result = await inventoryService.updateItem(itemId, data);

        if (result.success) {
          toast.success("Inventory item updated successfully");
          await onSubmit?.(data);
        } else {
          throw new Error(result.error || "Failed to update inventory item");
        }
      } else {
        // Create new item
        const result = await inventoryService.createItem(data);

        if (result.success) {
          toast.success("Inventory item created successfully");
          await onSubmit?.(data);
        } else {
          throw new Error(result.error || "Failed to create inventory item");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save inventory item. Please try again.";
      toast.error(message);
      console.error("Error saving inventory item:", error);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  SKU <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., FOOD-001" {...field} />
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
                <FormLabel>
                  Item Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Rice (50kg sack)" {...field} />
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
                  placeholder="Optional item description..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Category <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Non-Food">Non-Food</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Unit <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="sack">Sack</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="can">Can</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="liter">Liter (L)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Stock Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantityOnHand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Quantity on Hand <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantityAsOfDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Quantity As Of Date{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        field.onChange(new Date(value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="reorderLevel"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>
                  Reorder Level <span className="text-destructive">*</span>
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline-block ml-1 h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Alert when stock falls below this level</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Inventory Account */}
        <FormField
          control={form.control}
          name="inventoryAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Inventory Account <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select inventory account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetAccounts.length > 0 ? (
                    assetAccounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.accountCode} - {account.accountName}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="py-2 px-2 text-sm text-muted-foreground">
                      No asset accounts available
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pricing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unitCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Unit Cost <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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
          <FormField
            control={form.control}
            name="cogsAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  COGS Account <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="COGS account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {expenseAccounts.length > 0 ? (
                      expenseAccounts.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.accountCode} - {account.accountName}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="py-2 px-2 text-sm text-muted-foreground">
                        No expense accounts available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Selling Price <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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
          <FormField
            control={form.control}
            name="incomeAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Income Account <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="income account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {revenueAccounts.length > 0 ? (
                      revenueAccounts.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.accountCode} - {account.accountName}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="py-2 px-2 text-sm text-muted-foreground">
                        No revenue accounts available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Profit Margin</p>
            <p className="text-xl font-bold text-primary">{profitMargin}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Stock Value</p>
            <p className="text-xl font-bold text-primary">{totalValue}</p>
          </div>
        </div>

        {/* Tax Information */}
        <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
          <div className="flex items-start gap-2">
            <Percent className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p className="font-medium">Tax Configuration</p>
              <p className="text-xs mt-1">
                Configure sales and purchase tax rates for this item.
              </p>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            <FormField
              control={form.control}
              name="salesTaxEnabled"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Sales Tax</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {field.value
                          ? "Sales tax will be applied to this item"
                          : "No sales tax for this item"}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) {
                            form.setValue("salesTaxRate", undefined);
                          }
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {salesTaxEnabled && (
              <FormField
                control={form.control}
                name="salesTaxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sales Tax Rate (%){" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="e.g., 12"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="purchaseTaxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Tax Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="e.g., 12"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
                      ? "This item is active and available"
                      : "This item is inactive and hidden"}
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
          {/* <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            {cancelButtonText}
          </Button> */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
