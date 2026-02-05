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
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/common/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/common/data-table/data-table-advanced-toolbar";
import { DataTableFilterMenu } from "@/components/common/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/common/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import { useSuppliers } from "@/hooks/use-suppliers";
import { columns } from "./columns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@ui/sheet";
import { SupplierForm } from "@/components/forms/supplier-form/form";
import { supplierService } from "@/lib/services/supplier.service";
import type {
  Supplier as SupplierType,
  SupplierForm as SupplierFormType,
} from "@/lib/types/supplier";
import {
  Plus,
  Building2,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { Supplier as ColumnsSupplier } from "./columns";
import type { RowData, TableMeta } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onEdit?: (supplier: TData) => void;
    onView?: (supplier: TData) => void;
    onDelete?: (supplier: TData) => void;
  }
}

export default function SuppliersPage() {
  const {
    suppliers: rawSuppliers,
    loading: isLoading,
    fetchSuppliers,
    deleteSupplier,
  } = useSuppliers();
  // Keep lightweight search input wired to hidden column "search"
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState<ColumnsSupplier | null>(null);
  const [editingFormData, setEditingFormData] = useState<
    Partial<SupplierFormType & { _id?: string }> | undefined
  >(undefined);

  // Transform API supplier to table format
  const transformSupplier = (supplier: SupplierType): ColumnsSupplier => {
    return {
      id: supplier._id,
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      displayName: supplier.displayName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      paymentTerms: supplier.paymentTerms,
      currentBalance: supplier.currentBalance,
      isActive: supplier.isActive,
    };
  };

  // Transform suppliers from hook
  const suppliers = rawSuppliers.map(transformSupplier);
  const filteredSuppliers = suppliers; // DataTable handles filters client-side

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const totalBalance = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

  // Calculate average payment terms (simplified - just show "Net 30" for now)
  const avgPaymentTerms = "Net 30";

  // Initialize DataTable
  const { table } = useDataTable<ColumnsSupplier>({
    data: filteredSuppliers,
    columns,
    pageCount: Math.max(1, Math.ceil(filteredSuppliers.length / 10)),
    initialState: {
      sorting: [{ id: "supplierName", desc: false }],
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
      onEdit: async (supplier: ColumnsSupplier) => {
        try {
          // Fetch full supplier details for editing
          const result = await supplierService.getSupplierById(supplier.id);
          if (result.success && result.data) {
            const formData: Partial<SupplierFormType & { _id?: string }> = {
              _id: result.data._id,
              supplierCode: result.data.supplierCode,
              supplierName: result.data.supplierName,
              displayName: result.data.displayName,
              email: result.data.email,
              phone: result.data.phone,
              website: result.data.website,
              address: result.data.address,
              taxId: result.data.taxId,
              paymentTerms: result.data.paymentTerms,
              openingBalance: result.data.openingBalance,
              isActive: result.data.isActive,
              notes: result.data.notes,
            };
            setEditingFormData(formData);
            setEditingSupplier(supplier);
            setIsSheetOpen(true);
          }
        } catch (error) {
          toast.error("Failed to load supplier details");
          console.error("Error loading supplier:", error);
        }
      },
      onView: async (supplier: ColumnsSupplier) => {
        // For now, same as edit - can be enhanced later
        const result = await supplierService.getSupplierById(supplier.id);
        if (result.success && result.data) {
          const formData: Partial<SupplierFormType & { _id?: string }> = {
            _id: result.data._id,
            supplierCode: result.data.supplierCode,
            supplierName: result.data.supplierName,
            displayName: result.data.displayName,
            email: result.data.email,
            phone: result.data.phone,
            website: result.data.website,
            address: result.data.address,
            taxId: result.data.taxId,
            paymentTerms: result.data.paymentTerms,
            openingBalance: result.data.openingBalance,
            isActive: result.data.isActive,
            notes: result.data.notes,
          };
          setEditingFormData(formData);
          setEditingSupplier(supplier);
          setIsSheetOpen(true);
        }
      },
      onDelete: async (supplier: ColumnsSupplier) => {
        if (
          !confirm(
            `Are you sure you want to delete ${supplier.supplierName}? This will deactivate the supplier.`,
          )
        ) {
          return;
        }

        try {
          await deleteSupplier(supplier.id);
        } catch (error) {
          console.error("Error deleting supplier:", error);
        }
      },
    },
  });

  const handleFormSubmit = async () => {
    // Close the sheet after successful save
    setIsSheetOpen(false);
    setEditingSupplier(null);
    setEditingFormData(undefined);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    setEditingFormData(undefined);
    setIsSheetOpen(true);
  };

  const handleExportCSV = () => {
    // Export currently filtered rows from the table
    const rows = table.getFilteredRowModel().rows;
    const header = [
      "Supplier Code",
      "Supplier Name",
      "Email",
      "Phone",
      "Payment Terms",
      "Balance",
      "Status",
    ];
    const data = rows.map((r) => r.original);
    const csv = [
      header,
      ...data.map((s) => [
        s.supplierCode,
        s.supplierName,
        s.email,
        s.phone,
        s.paymentTerms,
        s.currentBalance,
        s.isActive ? "Active" : "Inactive",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suppliers.csv";
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Suppliers
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your supplier relationships
          </p>
        </div>

        <Sheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) {
              setEditingSupplier(null);
              setEditingFormData(undefined);
            }
          }}
        >
          <SheetTrigger asChild>
            <Button
              onClick={() => {
                setEditingSupplier(null);
                setEditingFormData(undefined);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </SheetTrigger>
          <SheetContent className="min-w-1/3">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span>🏢</span>{" "}
                <span>
                  {editingSupplier ? "Edit Supplier" : "Add Supplier"}
                </span>
              </SheetTitle>
              <SheetDescription>
                {editingSupplier
                  ? "Update supplier information"
                  : "Add a new supplier to your system"}
              </SheetDescription>
            </SheetHeader>
            {/* Supplier form */}
            <div className="overflow-y-scroll pb-10 no-scrollbar">
              <SupplierForm
                key={editingSupplier?.id || "new"} // Force re-render when editing different suppliers
                initialData={editingFormData}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsSheetOpen(false);
                  setEditingSupplier(null);
                  setEditingFormData(undefined);
                }}
                submitButtonText={
                  editingSupplier ? "Update Supplier" : "Create Supplier"
                }
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Suppliers
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {activeSuppliers} active
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Suppliers
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 group-hover:text-green-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {totalSuppliers > 0
                ? `${((activeSuppliers / totalSuppliers) * 100).toFixed(
                    0,
                  )}% of total`
                : "0% of total"}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payables
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600 group-hover:text-red-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Payment Terms
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPaymentTerms}</div>
            <p className="text-xs text-muted-foreground">Standard terms</p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card className="border border-border/50 gap-2">
        {/* <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>View and manage all suppliers</CardDescription>
        </CardHeader> */}
        <CardContent>
          <DataTable table={table}>
            <DataTableAdvancedToolbar table={table}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
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
