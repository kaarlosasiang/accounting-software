"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

import { InventoryItemForm } from "@/components/forms";
import { inventoryService } from "@/lib/services/inventory.service";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryItem as ColumnsInventoryItem } from "./columns";
import type { RowData, TableMeta } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onEdit?: (item: TData) => void;
    onView?: (item: TData) => void;
  }
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<ColumnsInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Keep lightweight search input wired to hidden column "search"
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ColumnsInventoryItem | null>(
    null
  );
  const [editingFormData, setEditingFormData] = useState<
    Partial<InventoryItemFormType & { _id: string }> | undefined
  >(undefined);
  const filteredInventory = inventory; // DataTable handles filters client-side

  // Transform API inventory item to table format
  const transformInventoryItem = (
    item: InventoryItem
  ): ColumnsInventoryItem => {
    // Determine status based on quantity
    let status: "in-stock" | "low-stock" | "out-of-stock" = "in-stock";
    if (item.quantityOnHand === 0) {
      status = "out-of-stock";
    } else if (item.quantityOnHand <= item.reorderLevel) {
      status = "low-stock";
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
      itemCode: item.sku,
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      quantityOnHand: item.quantityOnHand,
      reorderLevel: item.reorderLevel,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice,
      status,
      lastRestocked: item.quantityAsOfDate
        ? new Date(item.quantityAsOfDate).toLocaleDateString()
        : new Date().toLocaleDateString(),
    };
  };

  // Fetch inventory items
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const result = await inventoryService.getAllItems();
      if (result.success && result.data) {
        const transformed = result.data.map(transformInventoryItem);
        setInventory(transformed);
      } else {
        throw new Error(result.error || "Failed to fetch inventory items");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch inventory items";
      toast.error(message);
      console.error("Error fetching inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const totalItems = inventory.length;
  const inStock = inventory.filter((i) => i.status === "in-stock").length;
  const lowStock = inventory.filter((i) => i.status === "low-stock").length;
  const outOfStock = inventory.filter(
    (i) => i.status === "out-of-stock"
  ).length;
  const totalValue = inventory.reduce(
    (sum, i) => sum + i.quantityOnHand * i.unitCost,
    0
  );
  const potentialRevenue = inventory.reduce(
    (sum, i) => sum + i.quantityOnHand * i.sellingPrice,
    0
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
    await fetchInventory();

    // Close the sheet after successful save
    setIsSheetOpen(false);
    setEditingItem(null);
    setEditingFormData(undefined);
  };

  // Transform table item back to form format for editing
  const getFormInitialData = (
    item: ColumnsInventoryItem
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
      onView: (item: ColumnsInventoryItem) => {
        // TODO: route to details or open a view dialog
        console.log("View item", item);
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
            }
          }}
        >
          <SheetTrigger asChild>
            <Button
              onClick={() => {
                setEditingItem(null);
                setEditingFormData(undefined);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </SheetTrigger>
          <SheetContent className="min-w-1/3">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span>📦</span>{" "}
                <span>
                  {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
                </span>
              </SheetTitle>
              <SheetDescription>
                {editingItem
                  ? "Update inventory item details"
                  : "Create a new inventory item with stock details"}
              </SheetDescription>
            </SheetHeader>
            {/* Inventory form */}
            <div className="overflow-y-scroll pb-10 no-scrollbar">
              <InventoryItemForm
                key={editingItem?.id || "new"} // Force re-render when editing different items
                initialData={editingFormData}
                onSubmit={handleAddOrEditItem}
                onCancel={() => {
                  setIsSheetOpen(false);
                  setEditingItem(null);
                  setEditingFormData(undefined);
                }}
                submitButtonText={editingItem ? "Update Item" : "Save Item"}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

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
        {/* <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>View and manage all inventory items</CardDescription>
        </CardHeader> */}
        <CardContent>
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
