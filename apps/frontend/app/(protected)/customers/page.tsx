"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Mail,
  Phone,
  CreditCard,
  FileText,
} from "lucide-react";
import { CustomerForm } from "@/components/forms/customer-form/form";
import { formatCurrency } from "@/lib/utils";
import { useCustomers } from "@/hooks/use-customers";
import { DataTable } from "@/components/common/data-table/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/common/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { Customer } from "@/lib/types/customer";

export default function CustomersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const {
    customers,
    loading,
    deleteCustomer,
    toggleCustomerStatus,
    fetchCustomers,
  } = useCustomers();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      await deleteCustomer(id);
    }
  };

  const handleToggleStatus = async (id: string) => {
    await toggleCustomerStatus(id);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    fetchCustomers(); // Explicitly refetch to update table
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedCustomer(null);
    fetchCustomers(); // Explicitly refetch to update table
  };

  const handleDetailsClose = () => {
    setIsDetailsDialogOpen(false);
    setSelectedCustomer(null);
  };

  // Calculate stats
  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.isActive).length,
    totalBalance: customers.reduce((sum, c) => sum + c.currentBalance, 0),
    totalCredit: customers.reduce((sum, c) => sum + c.creditLimit, 0),
  };

  // Define columns
  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      // Hidden combined search column for global search
      {
        id: "search",
        accessorFn: (row) =>
          `${row.customerCode} ${row.customerName} ${row.displayName || ""} ${row.email} ${row.phone || ""}`,
        header: () => null,
        cell: () => null,
        meta: {
          label: "Search",
          placeholder: "🔎 Search customers...",
          variant: "text",
        },
        enableColumnFilter: true,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "customerCode",
        accessorKey: "customerCode",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Code" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("customerCode")}</div>
        ),
        meta: {
          label: "Customer Code",
          placeholder: "Search codes...",
          variant: "text",
          icon: FileText,
        },
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        id: "customerName",
        accessorKey: "customerName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Customer Name" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue("customerName")}</div>
            {row.original.displayName && (
              <div className="text-sm text-muted-foreground">
                {row.original.displayName}
              </div>
            )}
          </div>
        ),
        meta: {
          label: "Customer Name",
          placeholder: "Search names...",
          variant: "text",
          icon: Users,
        },
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Email" />
        ),
        cell: ({ row }) => row.getValue("email"),
        meta: {
          label: "Email",
          placeholder: "Search emails...",
          variant: "text",
          icon: Mail,
        },
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Phone" />
        ),
        cell: ({ row }) => row.getValue("phone"),
        meta: {
          label: "Phone",
          placeholder: "Search phones...",
          variant: "text",
          icon: Phone,
        },
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        id: "paymentTerms",
        accessorKey: "paymentTerms",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Payment Terms" />
        ),
        cell: ({ row }) => row.getValue("paymentTerms"),
        meta: {
          label: "Payment Terms",
          variant: "select",
          options: [
            { label: "Due on Receipt", value: "Due on Receipt" },
            { label: "Net 15", value: "Net 15" },
            { label: "Net 30", value: "Net 30" },
            { label: "Net 60", value: "Net 60" },
            { label: "Net 90", value: "Net 90" },
          ],
        },
        enableColumnFilter: true,
      },
      {
        id: "currentBalance",
        accessorKey: "currentBalance",
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} label="Balance" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(row.getValue("currentBalance"))}
          </div>
        ),
        meta: {
          label: "Balance",
          variant: "number",
          icon: DollarSign,
        },
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        id: "creditLimit",
        accessorKey: "creditLimit",
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} label="Credit Limit" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(row.getValue("creditLimit"))}
          </div>
        ),
        meta: {
          label: "Credit Limit",
          variant: "number",
          icon: CreditCard,
        },
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        id: "isActive",
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => (
          <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
            {row.getValue("isActive") ? "Active" : "Inactive"}
          </Badge>
        ),
        meta: {
          label: "Status",
          variant: "select",
          options: [
            { label: "Active", value: "true" },
            { label: "Inactive", value: "false" },
          ],
        },
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          return value.includes(String(row.getValue(id)));
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleStatus(row.original._id)}
              >
                {row.original.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(row.original._id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleToggleStatus, handleEdit, handleViewDetails],
  );

  const { table } = useDataTable({
    data: customers,
    columns,
    pageCount: Math.ceil(customers.length / 10),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: "customerName", desc: false }],
    },
    getRowId: (row) => row._id,
    manualFiltering: false,
    manualSorting: false,
    manualPagination: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Customers
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your customer accounts and track balances
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Enter the customer details below to create a new customer
                account.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update the customer details below.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              onSuccess={handleEditSuccess}
              initialData={selectedCustomer}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Customer Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Viewing details for {selectedCustomer?.customerName}
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Customer Code
                    </label>
                    <p className="mt-1">{selectedCustomer.customerCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Customer Name
                    </label>
                    <p className="mt-1">{selectedCustomer.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Display Name
                    </label>
                    <p className="mt-1">
                      {selectedCustomer.displayName || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          selectedCustomer.isActive ? "default" : "secondary"
                        }
                      >
                        {selectedCustomer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="mt-1">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <p className="mt-1">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Website
                    </label>
                    <p className="mt-1">{selectedCustomer.website || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tax ID
                    </label>
                    <p className="mt-1">{selectedCustomer.taxId}</p>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Billing Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Street
                    </label>
                    <p className="mt-1">
                      {selectedCustomer.billingAddress.street}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      City
                    </label>
                    <p className="mt-1">
                      {selectedCustomer.billingAddress.city}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      State
                    </label>
                    <p className="mt-1">
                      {selectedCustomer.billingAddress.state}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Zip Code
                    </label>
                    <p className="mt-1">
                      {selectedCustomer.billingAddress.zipCode}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Country
                    </label>
                    <p className="mt-1">
                      {selectedCustomer.billingAddress.country}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Payment Terms
                    </label>
                    <p className="mt-1">{selectedCustomer.paymentTerms}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Credit Limit
                    </label>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(selectedCustomer.creditLimit)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Current Balance
                    </label>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(selectedCustomer.currentBalance)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Available Credit
                    </label>
                    <p className="mt-1 font-semibold text-green-600">
                      {formatCurrency(
                        selectedCustomer.creditLimit -
                          selectedCustomer.currentBalance,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notes</h3>
                  <p className="text-sm">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleDetailsClose}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleDetailsClose();
                    handleEdit(selectedCustomer);
                  }}
                >
                  Edit Customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Receivables
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Credit Limit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalCredit)}
            </div>
            <p className="text-xs text-muted-foreground">Available credit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Accounts
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>
                View and manage all customer accounts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers found. Add your first customer to get started.
            </div>
          ) : (
            <DataTable table={table}>
              <DataTableToolbar table={table} />
            </DataTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
