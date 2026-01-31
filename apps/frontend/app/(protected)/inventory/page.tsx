"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DataTable } from "@/components/common/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/common/data-table/data-table-advanced-toolbar";
import { DataTableFilterMenu } from "@/components/common/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/common/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import { columns } from "./columns";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { InventoryItemForm } from "@/components/forms";
import { useInventory } from "@/hooks/use-inventory";
import type {
  InventoryItem,
  InventoryItemForm as InventoryItemFormType,
} from "@/lib/types/inventory";

import {
  Plus,
  Search,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Settings,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { InventoryItem as ColumnsInventoryItem } from "./columns";
import type { RowData, TableMeta } from "@tanstack/react-table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onEdit?: (item: TData) => void;
    onView?: (item: TData) => void;
    onAdjust?: (item: TData) => void;
  }
}

export default function InventoryPage() {
  const { items, isLoading, createItem, updateItem, adjustQuantity, refetch } =
    useInventory();
  const [itemTypeFilter, setItemTypeFilter] = useState<
    "all" | "Product" | "Service"
  >("all");
  // Keep lightweight search input wired to hidden column "search"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemType, setSelectedItemType] = useState<
    "Product" | "Service" | null
  >(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ColumnsInventoryItem | null>(
    null,
  );
  const [editingFormData, setEditingFormData] = useState<
    Partial<InventoryItemFormType & { _id: string }> | undefined
  >(undefined);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] =
    useState<ColumnsInventoryItem | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Transform API inventory item to table format
  const transformInventoryItem = (
    item: InventoryItem,
  ): ColumnsInventoryItem => {
    // Determine status based on quantity (only for products)
    let status: "in-stock" | "low-stock" | "out-of-stock" = "in-stock";
    if (item.itemType === "Product") {
      if (item.quantityOnHand === 0) {
        status = "out-of-stock";
      } else if (item.quantityOnHand <= item.reorderLevel) {
        status = "low-stock";
      }
    }

    // Extract account IDs (handle both string and object formats)
    const inventoryAccountId =
      typeof item.inventoryAccountId === "string"
        ? item.inventoryAccountId
        : item.inventoryAccountId?._id || "";
    const cogsAccountId =
      typeof item.cogsAccountId === "string"
        ? item.cogsAccountId
        : item.cogsAccountId?._id || "";
    const incomeAccountId =
      typeof item.incomeAccountId === "string"
        ? item.incomeAccountId
        : item.incomeAccountId?._id || "";

    return {
      id: item._id,
      itemType: item.itemType,
      itemCode: item.sku,
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      quantityOnHand: item.quantityOnHand || 0,
      reorderLevel: item.reorderLevel || 0,
      unitCost: item.unitCost || 0,
      sellingPrice: item.sellingPrice,
      status,
      lastRestocked: item.quantityAsOfDate
        ? new Date(item.quantityAsOfDate).toLocaleDateString()
        : new Date().toLocaleDateString(),
    };
  };

  // Transform items using useMemo
  const inventory = useMemo(() => {
    return items.map(transformInventoryItem);
  }, [items]);

  // Filter inventory based on item type
  const filteredInventory =
    itemTypeFilter === "all"
      ? inventory
      : inventory.filter((item) => item.itemType === itemTypeFilter);

  const totalItems = inventory.length;
  const inStock = inventory.filter((i) => i.status === "in-stock").length;
  const lowStock = inventory.filter((i) => i.status === "low-stock").length;
  const outOfStock = inventory.filter(
    (i) => i.status === "out-of-stock",
  ).length;
  const totalValue = inventory.reduce(
    (sum, i) => sum + i.quantityOnHand * i.unitCost,
    0,
  );
  const potentialRevenue = inventory.reduce(
    (sum, i) => sum + i.quantityOnHand * i.sellingPrice,
    0,
  );

  const inStockPct =
    totalItems > 0 ? ((inStock / totalItems) * 100).toFixed(1) : "0.0";
  const lowStockPct =
    totalItems > 0 ? ((lowStock / totalItems) * 100).toFixed(1) : "0.0";
  const profitMarginPct =
    totalValue > 0
      ? (((potentialRevenue - totalValue) / totalValue) * 100).toFixed(1)
      : "0.0";

  const handleExportCSV = () => {
    // Export currently filtered rows from the table
    const rows = table.getFilteredRowModel().rows;
    const header = [
      "Item Code",
      "Item Name",
      "Category",
      "Unit",
      "Qty On Hand",
      "Reorder Level",
      "Unit Cost",
      "Selling Price",
      "Status",
    ];
    const data = rows.map((r) => r.original);
    const csv = [
      header,
      ...data.map((i) => [
        i.itemCode,
        i.itemName,
        i.category,
        i.unit,
        i.quantityOnHand,
        i.reorderLevel,
        i.unitCost,
        i.sellingPrice,
        i.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.csv";
    a.click();
  };

  const handleAddOrEditItem = async () => {
    // Refresh inventory after successful save
    await refetch();

    // Close the sheet after successful save
    setIsSheetOpen(false);
    setEditingItem(null);
    setEditingFormData(undefined);
    setSelectedItemType(null);
  };

  const handleAdjustStock = async () => {
    if (!adjustingItem) return;

    if (adjustmentQuantity === 0) {
      toast.error("Adjustment quantity cannot be zero");
      return;
    }

    if (!adjustmentReason.trim()) {
      toast.error("Please provide a reason for the adjustment");
      return;
    }

    const success = await adjustQuantity(
      adjustingItem.id,
      adjustmentQuantity,
      adjustmentReason,
    );

    if (success) {
      setIsAdjustDialogOpen(false);
      setAdjustingItem(null);
      setAdjustmentQuantity(0);
      setAdjustmentReason("");
    }
  };

  // Transform table item back to form format for editing
  const getFormInitialData = (
    item: ColumnsInventoryItem,
  ): Partial<InventoryItemFormType & { _id: string }> | undefined => {
    if (!item) return undefined;

    // Find the original API item to get all fields
    const originalItem = inventory.find((i) => i.id === item.id);
    if (!originalItem) return undefined;

    // We need to fetch the full item details for editing
    // For now, return basic structure - the form will need to fetch full details
    return {
      _id: item.id,
      sku: item.itemCode,
      itemName: item.itemName,
      category: item.category as "Food" | "Non-Food",
      unit: item.unit as any,
      quantityOnHand: item.quantityOnHand,
      reorderLevel: item.reorderLevel,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice,
    };
  };

  // Initialize DataTable (client-side data with URL-sync state)
  const { table } = useDataTable<ColumnsInventoryItem>({
    data: filteredInventory,
    columns,
    pageCount: Math.max(1, Math.ceil(filteredInventory.length / 10)),
    initialState: {
      sorting: [{ id: "itemName", desc: false }],
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
      columnVisibility: { search: false },
    },
    getRowId: (row) => row.id,
    manualFiltering: false,
    manualSorting: false,
    manualPagination: false,
    meta: {
      onEdit: async (item: ColumnsInventoryItem) => {
        try {
          // Fetch full item details for editing
          const result = await inventoryService.getItemById(item.id);
          if (result.success && result.data) {
            const formData: Partial<InventoryItemFormType & { _id: string }> = {
              _id: result.data._id,
              sku: result.data.sku,
              itemName: result.data.itemName,
              description: result.data.description,
              category: result.data.category,
              unit: result.data.unit,
              quantityOnHand: result.data.quantityOnHand,
              quantityAsOfDate:
                result.data.quantityAsOfDate instanceof Date
                  ? result.data.quantityAsOfDate
                  : new Date(result.data.quantityAsOfDate),
              reorderLevel: result.data.reorderLevel,
              unitCost: result.data.unitCost,
              sellingPrice: result.data.sellingPrice,
              inventoryAccountId:
                typeof result.data.inventoryAccountId === "string"
                  ? result.data.inventoryAccountId
                  : result.data.inventoryAccountId?._id || "",
              cogsAccountId:
                typeof result.data.cogsAccountId === "string"
                  ? result.data.cogsAccountId
                  : result.data.cogsAccountId?._id || "",
              incomeAccountId:
                typeof result.data.incomeAccountId === "string"
                  ? result.data.incomeAccountId
                  : result.data.incomeAccountId?._id || "",
              supplierId: result.data.supplierId,
              salesTaxEnabled: result.data.salesTaxEnabled,
              salesTaxRate: result.data.salesTaxRate,
              purchaseTaxRate: result.data.purchaseTaxRate,
              isActive: result.data.isActive,
            };
            setEditingItem(item);
            setEditingFormData(formData);
            setIsSheetOpen(true);
          } else {
            throw new Error(result.error || "Failed to fetch item details");
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load item for editing";
          toast.error(message);
          console.error("Error fetching item:", error);
        }
      },
      onView: async (item: ColumnsInventoryItem) => {
        try {
          const result = await inventoryService.getItemById(item.id);
          if (result.success && result.data) {
            setViewingItem(result.data);
            setIsViewDialogOpen(true);
          } else {
            throw new Error(result.error || "Failed to fetch item details");
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load item details";
          toast.error(message);
          console.error("Error fetching item:", error);
        }
      },
      onAdjust: (item: ColumnsInventoryItem) => {
        setAdjustingItem(item);
        setAdjustmentQuantity(0);
        setAdjustmentReason("");
        setIsAdjustDialogOpen(true);
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your inventory items and stock levels
          </p>
        </div>

        <Sheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) {
              setEditingItem(null);
              setEditingFormData(undefined);
              setSelectedItemType(null);
            }
          }}
        >
          <SheetTrigger asChild>
            <Button
              onClick={() => {
                setEditingItem(null);
                setEditingFormData(undefined);
                setSelectedItemType(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </SheetTrigger>
          <SheetContent className="min-w-1/3">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {selectedItemType ? (
                  selectedItemType === "Product" ? (
                    <Package className="h-5 w-5" />
                  ) : (
                    <Settings className="h-5 w-5" />
                  )
                ) : (
                  <span>📦</span>
                )}
                <span>
                  {editingItem
                    ? `Edit ${editingItem.itemType}`
                    : selectedItemType
                      ? `Add ${selectedItemType}`
                      : "Add New Item"}
                </span>
              </SheetTitle>
              <SheetDescription>
                {editingItem
                  ? `Update ${editingItem.itemType.toLowerCase()} details`
                  : selectedItemType
                    ? selectedItemType === "Product"
                      ? "Create a new product with inventory tracking"
                      : "Create a new service without inventory tracking"
                    : "Choose whether to add a product or service"}
              </SheetDescription>
            </SheetHeader>

            {/* Item Type Selection or Form */}
            <div className="overflow-y-scroll pb-10 no-scrollbar">
              {!selectedItemType && !editingItem ? (
                // Step 1: Item Type Selection
                <div className="px-4 py-6">
                  <div className="flex flex-col gap-4">
                    <Button
                      variant="outline"
                      className="h-32 flex flex-col gap-3 hover:border-primary hover:bg-primary/5"
                      onClick={() => setSelectedItemType("Product")}
                    >
                      <Package className="h-10 w-10" />
                      <div className="text-center">
                        <p className="font-semibold text-base">Product</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Physical items with inventory tracking
                        </p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-32 flex flex-col gap-3 hover:border-primary hover:bg-primary/5"
                      onClick={() => setSelectedItemType("Service")}
                    >
                      <Settings className="h-10 w-10" />
                      <div className="text-center">
                        <p className="font-semibold text-base">Service</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Services without inventory tracking
                        </p>
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                // Step 2: Inventory Form
                <InventoryItemForm
                  key={editingItem?.id || `new-${selectedItemType}`}
                  initialData={editingFormData}
                  itemType={editingItem?.itemType || selectedItemType!}
                  onSubmit={handleAddOrEditItem}
                  onCancel={() => {
                    setIsSheetOpen(false);
                    setEditingItem(null);
                    setEditingFormData(undefined);
                    setSelectedItemType(null);
                  }}
                  submitButtonText={editingItem ? "Update Item" : "Save Item"}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {viewingItem?.itemName || "Item Details"}
            </DialogTitle>
            <DialogDescription>
              Complete inventory item information
            </DialogDescription>
          </DialogHeader>

          {viewingItem && (
            <div className="space-y-6 py-4">
              {/* Header with Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="text-lg font-semibold">{viewingItem.sku}</p>
                </div>
                <Badge variant={viewingItem.isActive ? "default" : "secondary"}>
                  {viewingItem.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Item Name</p>
                    <p className="font-medium">{viewingItem.itemName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{viewingItem.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unit</p>
                    <p className="font-medium">{viewingItem.unit}</p>
                  </div>
                  {viewingItem.description && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Description
                      </p>
                      <p className="font-medium">{viewingItem.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Stock Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                  Stock Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Quantity on Hand
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {viewingItem.quantityOnHand}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Reorder Level
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {viewingItem.reorderLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">As of Date</p>
                    <p className="font-medium">
                      {new Date(
                        viewingItem.quantityAsOfDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock Value</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(
                        viewingItem.quantityOnHand * viewingItem.unitCost,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                  Pricing & Profitability
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Cost</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(viewingItem.unitCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Selling Price
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(viewingItem.sellingPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Profit Margin
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {viewingItem.sellingPrice > 0
                        ? `${(
                            ((viewingItem.sellingPrice - viewingItem.unitCost) /
                              viewingItem.sellingPrice) *
                            100
                          ).toFixed(2)}%`
                        : "0%"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Potential Revenue
                    </p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(
                        viewingItem.quantityOnHand * viewingItem.sellingPrice,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                  Tax Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sales Tax</p>
                    <p className="font-medium">
                      {viewingItem.salesTaxEnabled
                        ? `${viewingItem.salesTaxRate || 0}%`
                        : "Not Applicable"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Purchase Tax
                    </p>
                    <p className="font-medium">
                      {viewingItem.purchaseTaxRate
                        ? `${viewingItem.purchaseTaxRate}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Accounting Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                  Accounting Setup
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Inventory Account
                    </p>
                    <p className="font-medium">
                      {typeof viewingItem.inventoryAccountId === "string"
                        ? viewingItem.inventoryAccountId
                        : viewingItem.inventoryAccountId?.accountName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      COGS Account
                    </p>
                    <p className="font-medium">
                      {typeof viewingItem.cogsAccountId === "string"
                        ? viewingItem.cogsAccountId
                        : viewingItem.cogsAccountId?.accountName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Income Account
                    </p>
                    <p className="font-medium">
                      {typeof viewingItem.incomeAccountId === "string"
                        ? viewingItem.incomeAccountId
                        : viewingItem.incomeAccountId?.accountName || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Adjust Stock - {adjustingItem?.itemName}
            </DialogTitle>
            <DialogDescription>
              Increase or decrease inventory quantity
            </DialogDescription>
          </DialogHeader>

          {adjustingItem && (
            <div className="space-y-4 py-4">
              {/* Current Stock Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Stock
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {adjustingItem.quantityOnHand}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New Stock</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {adjustingItem.quantityOnHand + adjustmentQuantity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adjustment Input */}
              <div className="space-y-2">
                <Label htmlFor="adjustment">Adjustment Quantity</Label>
                <Input
                  id="adjustment"
                  type="number"
                  placeholder="Enter quantity (positive to add, negative to reduce)"
                  value={adjustmentQuantity}
                  onChange={(e) =>
                    setAdjustmentQuantity(Number(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Positive numbers increase stock, negative numbers decrease
                  stock
                </p>
              </div>

              {/* Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Adjustment</Label>
                <Textarea
                  id="reason"
                  placeholder="E.g., Physical count correction, Damaged goods, etc."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Warning for negative adjustment */}
              {adjustmentQuantity < 0 &&
                adjustingItem.quantityOnHand + adjustmentQuantity < 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ Warning: This adjustment will result in negative stock!
                    </p>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdjustDialogOpen(false);
                    setAdjustingItem(null);
                    setAdjustmentQuantity(0);
                    setAdjustmentReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAdjustStock}>Adjust Stock</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{inStockPct}% in stock</span>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
              <Package className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inStock}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>Healthy stock</span>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <div className="rounded-full bg-orange-500/10 p-2.5 group-hover:bg-orange-500/20 transition-colors duration-300 group-hover:scale-110">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStock}</div>
            <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>{lowStockPct}% need reorder</span>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalValue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{profitMarginPct}% margin</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="border border-border/50 gap-2">
        <CardContent className="pt-6">
          {/* Item Type Filter Tabs */}
          <div className="mb-4">
            <Tabs
              value={itemTypeFilter}
              onValueChange={(value) =>
                setItemTypeFilter(value as "all" | "Product" | "Service")
              }
            >
              <TabsList>
                <TabsTrigger value="all">
                  All Items ({inventory.length})
                </TabsTrigger>
                <TabsTrigger value="Product">
                  Products (
                  {inventory.filter((i) => i.itemType === "Product").length})
                </TabsTrigger>
                <TabsTrigger value="Service">
                  Services (
                  {inventory.filter((i) => i.itemType === "Service").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <DataTable table={table}>
            <DataTableAdvancedToolbar table={table}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  className="pl-8 w-56 h-8"
                  value={searchQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchQuery(v);
                    table.getColumn("search")?.setFilterValue(v || undefined);
                  }}
                />
              </div>
              <DataTableFilterMenu table={table} />
              <DataTableSortList table={table} />
              <Button
                variant="outline"
                size={"sm"}
                className="font-normal"
                onClick={handleExportCSV}
              >
                <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                Export CSV
              </Button>
            </DataTableAdvancedToolbar>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}
