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
import {
  Info,
  Save,
  Percent,
  Package,
  DollarSign,
  TrendingUp,
  Settings,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { inventoryItemSchema, type InventoryItem } from "@sas/validators";
import { useAccounts } from "@/hooks/use-accounts";
import { useSuppliers } from "@/hooks/use-suppliers";
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
  itemType: propItemType,
  submitButtonText = "Save Item",
  cancelButtonText = "Cancel",
}: InventoryItemFormProps) {
  const { accounts: assetAccounts } = useAccounts("Asset");
  const { accounts: expenseAccounts } = useAccounts("Expense");
  const { accounts: revenueAccounts } = useAccounts("Revenue");
  const { suppliers } = useSuppliers();

  // Store the item ID for updates
  const [itemId, setItemId] = useState<string | undefined>(
    initialData && "_id" in initialData
      ? (initialData._id as string)
      : undefined,
  );

  // Helper to convert date string or Date to Date object
  const parseDate = (date: Date | string | undefined): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    return new Date(date);
  };

  const getDefaultValues = (): InventoryItem => {
    const defaultItemType = propItemType || initialData?.itemType || "Product";
    const baseData: InventoryItem = {
      itemType: defaultItemType,
      sku: "",
      itemName: "",
      description: "",
      category: defaultItemType === "Service" ? "Service" : "Food",
      unit: defaultItemType === "Service" ? "service" : "pcs",
      quantityOnHand: defaultItemType === "Service" ? 0 : 0,
      quantityAsOfDate: new Date(),
      reorderLevel: defaultItemType === "Service" ? 0 : 0,
      unitCost: defaultItemType === "Service" ? 0 : 0,
      sellingPrice: 0,
      inventoryAccountId: "",
      cogsAccountId: "",
      incomeAccountId: "",
      supplierId: undefined,
      salesTaxEnabled: false,
      salesTaxRate: undefined,
      purchaseTaxRate: undefined,
      isActive: true,
    } as InventoryItem;

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
    mode: "onSubmit",
  });

  // Debug form errors
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log("Form value changed:", { name, type, value });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    console.log("Form errors:", form.formState.errors);
  }, [form.formState.errors]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      const values = getDefaultValues();
      Object.keys(values).forEach((key) => {
        form.setValue(
          key as keyof InventoryItem,
          values[key as keyof InventoryItem] as any,
        );
      });
      // Update itemId for edit mode
      if ("_id" in initialData) {
        setItemId(initialData._id as string);
      }
    } else {
      // Reset form and itemId when initialData is cleared (switching to create mode)
      form.reset(getDefaultValues());
      setItemId(undefined);
    }
  }, [initialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch form values for computed fields
  const itemType = form.watch("itemType");
  const sellingPrice = form.watch("sellingPrice");
  const unitCost = form.watch("unitCost");
  const quantityOnHand = form.watch("quantityOnHand");
  const salesTaxEnabled = form.watch("salesTaxEnabled");
  const isService = itemType === "Service";

  const profitMargin =
    sellingPrice > 0 && unitCost !== undefined
      ? (((sellingPrice - unitCost) / sellingPrice) * 100).toFixed(2)
      : "0.00";

  const totalValue = formatCurrency((quantityOnHand || 0) * (unitCost || 0));

  const handleSubmit = async (data: InventoryItem) => {
    setIsSubmitting(true);
    try {
      console.log("Form submit - itemId:", itemId);
      console.log("Raw form data:", data);

      // Clean data and ensure it matches InventoryItemForm type
      let cleanedData: InventoryItemForm = {
        ...data,
        quantityOnHand: data.quantityOnHand || 0,
        reorderLevel: data.reorderLevel || 0,
        unitCost: data.unitCost || 0,
        sellingPrice: data.sellingPrice || 0,
        quantityAsOfDate: data.quantityAsOfDate || new Date(),
        inventoryAccountId: data.inventoryAccountId || "",
        cogsAccountId: data.cogsAccountId || "",
        incomeAccountId: data.incomeAccountId || "",
        salesTaxEnabled: data.salesTaxEnabled || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      };

      // Override service-specific fields
      if (data.itemType === "Service") {
        cleanedData = {
          ...cleanedData,
          quantityOnHand: 0,
          reorderLevel: 0,
          unitCost: 0,
          supplierId: undefined,
        };
      }

      console.log("Cleaned form data:", cleanedData);

      if (itemId) {
        // Update existing item
        console.log("Updating item with ID:", itemId);
        const result = await inventoryService.updateItem(itemId, cleanedData);

        if (result.success) {
          toast.success("Inventory item updated successfully");
          await onSubmit?.(cleanedData);
        } else {
          throw new Error(result.error || "Failed to update inventory item");
        }
      } else {
        // Create new item
        console.log("Creating new item");
        const result = await inventoryService.createItem(cleanedData);

        if (result.success) {
          toast.success("Inventory item created successfully");
          await onSubmit?.(cleanedData);
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
        onSubmit={(e) => {
          console.log("Form onSubmit triggered");
          console.log("Current form values:", form.getValues());
          console.log("Form errors before submit:", form.formState.errors);
          form.handleSubmit(handleSubmit)(e);
        }}
        className="space-y-6 px-4"
      >
        {/* Item Type Display (Read-only) */}
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            {itemType === "Product" ? (
              <Package className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Settings className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {itemType === "Product" ? "Product" : "Service"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {itemType === "Product"
                ? "With inventory tracking"
                : "Without inventory tracking"}
            </span>
          </div>
        </div>

        {/* Section 1: Basic Information */}
        <div className="space-y-4">
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
                    <Input
                      placeholder={
                        isService ? "e.g., SRV-001" : "e.g., FOOD-001"
                      }
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {isService
                      ? "Unique service code"
                      : "Unique Stock Keeping Unit code"}
                  </p>
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
                    {isService ? "Service Name" : "Item Name"}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isService
                          ? "e.g., Consulting Services"
                          : "e.g., Rice (50kg sack)"
                      }
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {isService
                      ? "How this service appears in invoices"
                      : "How this item appears in listings"}
                  </p>
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
                    placeholder={
                      isService
                        ? "Optional service description..."
                        : "Optional item description..."
                    }
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {isService
                    ? "Optional details about the service provided"
                    : "Optional details like specifications, size, color, etc."}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Section 2: Categorization */}
        <div className="space-y-4">
          <Separator />
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
                      {isService ? (
                        <SelectItem value="Service">Service</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="Food">Food</SelectItem>
                          <SelectItem value="Non-Food">Non-Food</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {isService
                      ? "Service category"
                      : "Product category classification"}
                  </p>
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
                      {isService ? (
                        <>
                          <SelectItem value="service">Per Service</SelectItem>
                          <SelectItem value="hour">Per Hour</SelectItem>
                          <SelectItem value="session">Per Session</SelectItem>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {isService
                      ? "Billing unit for this service"
                      : "Unit of measurement for this item"}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 3: Stock & Inventory - Only for Products */}
        {!isService && (
          <div className="space-y-4">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantityOnHand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity on Hand{" "}
                      <span className="text-destructive">*</span>
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
                    <p className="text-xs text-muted-foreground">
                      Current available stock quantity
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      Reference date for the quantity above
                    </p>
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
                  <FormLabel>
                    Reorder Level <span className="text-destructive">*</span>
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
                  <p className="text-xs text-muted-foreground">
                    Get notified when stock drops to this level
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Section 4: Accounting Configuration */}
        <div className="space-y-4">
          <Separator />
          {!isService && (
            <FormField
              control={form.control}
              name="inventoryAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Inventory Account{" "}
                    <span className="text-destructive">*</span>
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
                  <p className="text-xs text-muted-foreground">
                    Asset account for tracking inventory value
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {!isService && (
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {suppliers
                        .filter((supplier) => supplier.isActive)
                        .map((supplier) => (
                          <SelectItem key={supplier._id} value={supplier._id}>
                            {supplier.supplierName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Primary supplier for purchasing this item
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isService && (
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
                    <p className="text-xs text-muted-foreground">
                      Purchase cost per unit
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {!isService && (
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
                    <p className="text-xs text-muted-foreground">
                      Expense account for cost of goods sold
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isService ? "Service Rate" : "Selling Price"}{" "}
                    <span className="text-destructive">*</span>
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
                  <p className="text-xs text-muted-foreground">
                    {isService
                      ? "Price per unit of service"
                      : "Sales price per unit"}
                  </p>
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
                    {isService ? "Service Income Account" : "Income Account"}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isService
                              ? "Select service income account"
                              : "Select income account"
                          }
                        />
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
          {!isService && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-xl font-bold text-primary">
                  {profitMargin}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Stock Value
                </p>
                <p className="text-xl font-bold text-primary">{totalValue}</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Tax Configuration */}
        <div className="space-y-4">
          <Separator />
          <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
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
                            e.target.value ? Number(e.target.value) : undefined,
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
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    VAT or tax rate when purchasing this item
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 7: Status */}
        <div className="space-y-4">
          <Separator />
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
        </div>

        {/* Form Actions */}
        <Separator />
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
