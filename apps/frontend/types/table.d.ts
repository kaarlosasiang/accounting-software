import "@tanstack/react-table";
import type { Account } from "@/lib/services/accounts.service";

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onView?: (row: TData) => void;
    onDelete?: (row: TData) => void;
    onArchive?: (row: TData) => void;
    onRestore?: (row: TData) => void;
    onReconcile?: (row: TData) => void;
  }
}
