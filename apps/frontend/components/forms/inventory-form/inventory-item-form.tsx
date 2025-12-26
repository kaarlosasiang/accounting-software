"use client";

import { useState } from "react";
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
import { Info, Save } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { inventoryItemSchema } from "@rrd10-sas/validators";
import type { InventoryItemForm, InventoryItemFormProps } from "./ types";

export function InventoryItemForm({
  onSubmit,
  onCancel,
  initialData,
  submitButtonText = "Save Item",
  cancelButtonText = "Cancel",
}: InventoryItemFormProps) {
  const [formData, setFormData] = useState<InventoryItemForm>({
    itemCode: "",
    itemName: "",
    description: "",
    category: "",
    unit: "",
    quantityOnHand: 0,
    reorderLevel: 0,
    unitCost: 0,
    sellingPrice: 0,
    inventoryAccountId: "",
    cogsAccountId: "",
    incomeAccountId: "",
    isActive: true,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    field: keyof InventoryItemForm,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const result = inventoryItemSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = (issue.path[0] ?? "") as string;
        if (key) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting form data:", formData);
    try {
      await onSubmit?.(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const profitMargin =
    formData.sellingPrice > 0
      ? (
          ((formData.sellingPrice - formData.unitCost) /
            formData.sellingPrice) *
          100
        ).toFixed(2)
      : "0.00";

  const totalValue = formatCurrency(
    formData.quantityOnHand * formData.unitCost
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemCode">
            Item Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="itemCode"
            placeholder="e.g., FOOD-001"
            value={formData.itemCode}
            onChange={(e) => handleChange("itemCode", e.target.value)}
            className={errors.itemCode ? "border-destructive" : ""}
          />
          {errors.itemCode && (
            <p className="text-xs text-destructive">{errors.itemCode}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="itemName">
            Item Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="itemName"
            placeholder="e.g., Rice (50kg sack)"
            value={formData.itemName}
            onChange={(e) => handleChange("itemName", e.target.value)}
            className={errors.itemName ? "border-destructive" : ""}
          />
          {errors.itemName && (
            <p className="text-xs text-destructive">{errors.itemName}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional item description..."
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleChange("category", value)}
          >
            <SelectTrigger
              className={`${
                errors.category ? "border-destructive" : ""
              } w-full`}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Food">Food</SelectItem>
              <SelectItem value="Non-Food">Non-Food</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">
            Unit <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => handleChange("unit", value)}
          >
            <SelectTrigger
              className={`${errors.unit ? "border-destructive" : ""} w-full`}
            >
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
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
          {errors.unit && (
            <p className="text-xs text-destructive">{errors.unit}</p>
          )}
        </div>
      </div>

      {/* Stock Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantityOnHand">
            Quantity on Hand <span className="text-destructive">*</span>
          </Label>
          <Input
            id="quantityOnHand"
            type="number"
            min="0"
            placeholder="0"
            value={formData.quantityOnHand}
            onChange={(e) =>
              handleChange("quantityOnHand", Number(e.target.value))
            }
            className={errors.quantityOnHand ? "border-destructive" : ""}
          />
          {errors.quantityOnHand && (
            <p className="text-xs text-destructive">{errors.quantityOnHand}</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="reorderLevel">
              Reorder Level <span className="text-destructive">*</span>
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="inline-block ml-1 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Alert when stock falls below this level</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="reorderLevel"
            type="number"
            min="0"
            placeholder="0"
            value={formData.reorderLevel}
            onChange={(e) =>
              handleChange("reorderLevel", Number(e.target.value))
            }
            className={errors.reorderLevel ? "border-destructive" : ""}
          />
          {errors.reorderLevel && (
            <p className="text-xs text-destructive">{errors.reorderLevel}</p>
          )}
        </div>
      </div>

      {/* Pricing Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitCost">
            Unit Cost <span className="text-destructive">*</span>
          </Label>
          <Input
            id="unitCost"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.unitCost}
            onChange={(e) => handleChange("unitCost", Number(e.target.value))}
            className={errors.unitCost ? "border-destructive" : ""}
          />
          {errors.unitCost && (
            <p className="text-xs text-destructive">{errors.unitCost}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellingPrice">
            Selling Price <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.sellingPrice}
            onChange={(e) =>
              handleChange("sellingPrice", Number(e.target.value))
            }
            className={errors.sellingPrice ? "border-destructive" : ""}
          />
          {errors.sellingPrice && (
            <p className="text-xs text-destructive">{errors.sellingPrice}</p>
          )}
        </div>
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

      {/* Accounting Accounts */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inventoryAccountId">
              Inventory Account ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inventoryAccountId"
              placeholder="24-char ObjectId"
              value={formData.inventoryAccountId}
              onChange={(e) =>
                handleChange("inventoryAccountId", e.target.value)
              }
              className={errors.inventoryAccountId ? "border-destructive" : ""}
            />
            {errors.inventoryAccountId && (
              <p className="text-xs text-destructive">
                {errors.inventoryAccountId}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cogsAccountId">
              COGS Account ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cogsAccountId"
              placeholder="24-char ObjectId"
              value={formData.cogsAccountId}
              onChange={(e) => handleChange("cogsAccountId", e.target.value)}
              className={errors.cogsAccountId ? "border-destructive" : ""}
            />
            {errors.cogsAccountId && (
              <p className="text-xs text-destructive">{errors.cogsAccountId}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="incomeAccountId">
              Income Account ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="incomeAccountId"
              placeholder="24-char ObjectId"
              value={formData.incomeAccountId}
              onChange={(e) => handleChange("incomeAccountId", e.target.value)}
              className={errors.incomeAccountId ? "border-destructive" : ""}
            />
            {errors.incomeAccountId && (
              <p className="text-xs text-destructive">
                {errors.incomeAccountId}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Use the accounting account IDs for inventory asset, cost of goods
          sold, and revenue.
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="isActive">Active Status</Label>
          <p className="text-sm text-muted-foreground">
            {formData.isActive
              ? "This item is active and available"
              : "This item is inactive and hidden"}
          </p>
        </div>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => handleChange("isActive", checked)}
        />
      </div>

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
  );
}
