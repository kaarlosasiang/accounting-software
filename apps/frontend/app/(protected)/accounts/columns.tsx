"use client";

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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  RefreshCw,
} from "lucide-react";
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/lib/services/accounts.service";
import Link from "next/link";

export const columns: ColumnDef<Account>[] = [
  // Hidden combined search column for global search
  {
    id: "search",
    accessorFn: (row) =>
      `${row.accountCode} ${row.accountName} ${row.description || ""}`,
    header: () => null,
    cell: () => null,
    meta: {
      label: "Search",
      placeholder: "🔎 Search accounts...",
      variant: "text",
    },
    enableColumnFilter: true,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "accountCode",
    accessorKey: "accountCode",
    size: 80,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Code" />
    ),
    cell: ({ row }) => (
      <span className="font-medium font-mono text-sm">
        {row.getValue("accountCode")}
      </span>
    ),
    meta: {
      label: "Account Code",
      placeholder: "Search code...",
      variant: "text",
    },
    enableColumnFilter: false,
    enableSorting: true,
  },
  {
    id: "accountName",
    accessorKey: "accountName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Account Name" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/accounts/${row.original._id}`}
        className="hover:underline font-medium"
      >
        {row.getValue("accountName")}
      </Link>
    ),
    meta: {
      label: "Account Name",
      placeholder: "Search accounts...",
      variant: "text",
    },
    enableColumnFilter: false,
    enableSorting: true,
  },
  {
    id: "accountType",
    accessorKey: "accountType",
    header: ({ column }) => (
      <div className="text-center">
        <DataTableColumnHeader column={column} label="Type" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge variant="outline">{row.getValue("accountType")}</Badge>
      </div>
    ),
    meta: {
      label: "Account Type",
      variant: "select",
      options: [
        { label: "Asset", value: "Asset" },
        { label: "Liability", value: "Liability" },
        { label: "Equity", value: "Equity" },
        { label: "Revenue", value: "Revenue" },
        { label: "Expense", value: "Expense" },
      ],
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "subType",
    accessorKey: "subType",
    header: ({ column }) => (
      <div className="text-center">
        <DataTableColumnHeader column={column} label="Sub Type" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("subType") || "-"}</div>
    ),
    meta: {
      label: "Sub Type",
      placeholder: "Search sub type...",
      variant: "text",
    },
    enableColumnFilter: false,
    enableSorting: true,
  },
  {
    id: "normalBalance",
    accessorKey: "normalBalance",
    header: ({ column }) => (
      <div className="text-center">
        <DataTableColumnHeader column={column} label="Normal Balance" />
      </div>
    ),
    cell: ({ row }) => {
      const balance = row.getValue<string>("normalBalance");
      return (
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className={
              balance === "Debit"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-green-50 text-green-700 border-green-200"
            }
          >
            {balance}
          </Badge>
        </div>
      );
    },
    meta: {
      label: "Normal Balance",
      variant: "select",
      options: [
        { label: "Debit", value: "Debit" },
        { label: "Credit", value: "Credit" },
      ],
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "balance",
    accessorKey: "balance",
    header: ({ column }) => (
      <div className="text-right">
        <DataTableColumnHeader column={column} label="Balance" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right">
        <span className="font-mono font-semibold">
          {formatCurrency(row.getValue<number>("balance") || 0)}
        </span>
      </div>
    ),
    meta: {
      label: "Balance",
      variant: "number",
      unit: "$",
    },
    enableColumnFilter: false,
    enableSorting: true,
  },
  {
    id: "status",
    accessorKey: "isActive",
    header: ({ column }) => (
      <div className="text-center">
        <DataTableColumnHeader column={column} label="Status" />
      </div>
    ),
    cell: ({ row }) => {
      const isActive = row.getValue<boolean>("isActive") !== false; // Default to true if undefined
      return (
        <div className="flex justify-center">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={
              isActive
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }
          >
            {isActive ? "Active" : "Archived"}
          </Badge>
        </div>
      );
    },
    meta: {
      label: "Status",
      variant: "select",
      options: [
        { label: "Active", value: "true" },
        { label: "Archived", value: "false" },
      ],
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "actions",
    header: ({ column }) => (
      <div className="text-right">
        <DataTableColumnHeader column={column} label="Actions" />
      </div>
    ),
    cell: ({ row, table }) => {
      const isActive = row.original.isActive !== false; // Default to true if undefined
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => table.options.meta?.onView?.(row.original)}
              >
                <Edit className="mr-2 h-4 w-4" />
                View/Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => table.options.meta?.onReconcile?.(row.original)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconcile Balance
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isActive ? (
                <DropdownMenuItem
                  onClick={() => table.options.meta?.onArchive?.(row.original)}
                  className="text-orange-600"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => table.options.meta?.onRestore?.(row.original)}
                  className="text-blue-600"
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Restore
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => table.options.meta?.onDelete?.(row.original)}
                className="text-destructive"
                disabled={!isActive}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
