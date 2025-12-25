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
import { MoreHorizontal } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { formatCurrency } from "@/lib/utils";

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  lastRestocked: string;
}

export const columns: ColumnDef<InventoryItem>[] = [
  // Hidden combined search column for global search across fields
  {
    id: "search",
    accessorFn: (row) => `${row.itemCode} ${row.itemName} ${row.category}`,
    header: () => null,
    cell: () => null,
    meta: {
      label: "Search",
      placeholder: "Search inventory...",
      variant: "text",
    },
    enableColumnFilter: true,
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "itemCode",
    accessorKey: "itemCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Item Code" />
    ),
    cell: ({ row }) => (
      <span className="font-medium font-mono text-sm">
        {row.getValue("itemCode")}
      </span>
    ),
    meta: {
      label: "Item Code",
      placeholder: "Search item code...",
      variant: "text",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "itemName",
    accessorKey: "itemName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Item Name" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.getValue("itemName")}</span>
        <span className="text-xs text-muted-foreground">{row.original.id}</span>
      </div>
    ),
    meta: {
      label: "Item Name",
      placeholder: "Search items...",
      variant: "text",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "category",
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Category" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("category")}</Badge>
    ),
    meta: {
      label: "Category",
      variant: "select",
      options: [
        { label: "Food", value: "Food" },
        { label: "Non-Food", value: "Non-Food" },
      ],
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "quantityOnHand",
    accessorKey: "quantityOnHand",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Quantity" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold">
          {row.getValue<number>("quantityOnHand")} {row.original.unit}
        </span>
        <span className="text-xs text-muted-foreground">
          Min: {row.original.reorderLevel}
        </span>
      </div>
    ),
    meta: {
      label: "Quantity",
      placeholder: "Search quantity...",
      variant: "number",
      unit: "pcs",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "unitCost",
    accessorKey: "unitCost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Unit Cost" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.getValue<number>("unitCost"))}
      </span>
    ),
    meta: {
      label: "Unit Cost",
      variant: "number",
      unit: "₱",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "sellingPrice",
    accessorKey: "sellingPrice",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Selling Price" />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-green-600">
        {formatCurrency(row.getValue<number>("sellingPrice"))}
      </span>
    ),
    meta: {
      label: "Selling Price",
      variant: "number",
      unit: "₱",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "value",
    accessorFn: (row) => row.quantityOnHand * row.unitCost,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Value" />
    ),
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(row.getValue<number>("value"))}
      </span>
    ),
    meta: {
      label: "Value",
      variant: "number",
      unit: "₱",
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      const variant =
        status === "in-stock"
          ? "default"
          : status === "low-stock"
          ? "secondary"
          : "destructive";
      return <Badge variant={variant as any}>{status}</Badge>;
    },
    meta: {
      label: "Status",
      variant: "select",
      options: [
        { label: "In Stock", value: "in-stock" },
        { label: "Low Stock", value: "low-stock" },
        { label: "Out of Stock", value: "out-of-stock" },
      ],
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Actions" />
    ),
    cell: ({ row, table }) => (
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
              onClick={() =>
                (table.options.meta as any)?.onView?.(row.original)
              }
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (table.options.meta as any)?.onEdit?.(row.original)
              }
            >
              Edit Item
            </DropdownMenuItem>
            <DropdownMenuItem>Adjust Stock</DropdownMenuItem>
            <DropdownMenuItem>View Transactions</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Reorder Stock</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Deactivate Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    meta: {
      label: "Actions",
    },
    enableColumnFilter: false,
    enableSorting: false,
  },
];
