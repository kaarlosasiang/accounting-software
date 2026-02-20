"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash } from "lucide-react";
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header";
import { formatCurrency } from "@/lib/utils";

export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  displayName?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentTerms: string;
  currentBalance: number;
  isActive: boolean;
}

export const columns: ColumnDef<Supplier>[] = [
  // Hidden combined search column for global search
  {
    id: "search",
    accessorFn: (row) =>
      `${row.supplierCode} ${row.supplierName} ${row.displayName || ""} ${row.email}`,
    header: () => null,
    cell: () => null,
    meta: {
      label: "Search",
      placeholder: "Search suppliers...",
      variant: "text",
    },
    enableColumnFilter: true,
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "supplierCode",
    accessorKey: "supplierCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Code" />
    ),
    cell: ({ row }) => (
      <span className="font-medium font-mono text-sm">
        {row.getValue("supplierCode")}
      </span>
    ),
    meta: {
      label: "Supplier Code",
      placeholder: "Search code...",
      variant: "text",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "supplierName",
    accessorKey: "supplierName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Supplier Name" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">
          {row.original.displayName || row.getValue("supplierName")}
        </span>
        <span className="text-xs text-muted-foreground">
          {row.original.address.city}, {row.original.address.state}
        </span>
      </div>
    ),
    meta: {
      label: "Supplier Name",
      placeholder: "Search suppliers...",
      variant: "text",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "email",
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Contact" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">{row.getValue("email")}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.phone}
        </span>
      </div>
    ),
    meta: {
      label: "Email",
      placeholder: "Search email...",
      variant: "text",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "paymentTerms",
    accessorKey: "paymentTerms",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Payment Terms" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("paymentTerms")}</span>
    ),
    meta: {
      label: "Payment Terms",
      variant: "text",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "currentBalance",
    accessorKey: "currentBalance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Balance" />
    ),
    cell: ({ row }) => {
      const balance = row.getValue("currentBalance") as number;
      return (
        <span
          className={`font-medium ${
            balance > 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          {formatCurrency(balance)}
        </span>
      );
    },
    meta: {
      label: "Balance",
      variant: "number",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <Badge
          variant="outline"
          className={
            isActive
              ? "bg-green-500/10 text-green-600 border-green-500/20"
              : "bg-gray-500/10 text-gray-600 border-gray-500/20"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    meta: {
      label: "Status",
      variant: "select",
      options: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
    enableColumnFilter: true,
    enableSorting: true,
    filterFn: (row, id, value) => {
      return String(row.getValue(id)) === value;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const supplier = row.original;
      const meta = table.options.meta as {
        onEdit?: (supplier: Supplier) => void;
        onView?: (supplier: Supplier) => void;
        onDelete?: (supplier: Supplier) => void;
        onRestore?: (supplier: Supplier) => void;
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => meta.onView?.(supplier)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta.onEdit?.(supplier)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {supplier.isActive ? (
              <DropdownMenuItem
                onClick={() => meta.onDelete?.(supplier)}
                className="cursor-pointer text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => meta.onRestore?.(supplier)}
                className="cursor-pointer text-green-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Restore
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
  },
];
