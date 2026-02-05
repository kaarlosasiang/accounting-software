"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/hooks/use-accounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, Download } from "lucide-react";
import { accountsService, type Account } from "@/lib/services/accounts.service";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/format";
import { DataTable } from "@/components/common/data-table/data-table";
import { DataTableToolbar } from "@/components/common/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { columns } from "../columns";

export default function LiabilityAccountsPage() {
  const router = useRouter();
  const { accounts, loading, error, refetch } = useAccounts();
  const liabilityAccounts = accounts.filter(
    (a) => a.accountType === "Liability",
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Initialize DataTable
  const { table } = useDataTable<Account>({
    data: liabilityAccounts,
    columns,
    pageCount: Math.max(1, Math.ceil(liabilityAccounts.length / 10)),
    initialState: {
      sorting: [{ id: "accountCode", desc: false }],
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
    getRowId: (row) => row._id,
    manualFiltering: false,
    manualSorting: false,
    manualPagination: false,
    meta: {
      onView: (account: Account) => {
        router.push(`/accounts/${account._id}`);
      },
      onDelete: (account: Account) => {
        setDeleteId(account._id);
      },
    },
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const result = await accountsService.deleteAccount(deleteId);
      if (result.success) {
        toast.success("Account deleted successfully");
        refetch();
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete account",
      );
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const totalBalance = liabilityAccounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0,
  );

  const handleExportCSV = () => {
    const rows = table.getFilteredRowModel().rows;
    const header = [
      "Code",
      "Account Name",
      "Type",
      "Sub Type",
      "Normal Balance",
      "Balance",
    ];
    const data = rows.map((r) => r.original);
    const csv = [
      header,
      ...data.map((a) => [
        a.accountCode,
        a.accountName,
        a.accountType,
        a.subType || "",
        a.normalBalance || "",
        a.balance || 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "liability-accounts.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
              Liability Accounts
            </h1>
            <p className="text-muted-foreground text-sm">
              View and manage liability accounts
            </p>
          </div>
        </div>
        <Link href="/accounts/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </Link>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Liabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {liabilityAccounts.length} liability accounts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataTable table={table}>
            <DataTableToolbar table={table}>
              <Button
                variant="outline"
                size={"sm"}
                className="font-normal"
                onClick={handleExportCSV}
              >
                <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                Export CSV
              </Button>
            </DataTableToolbar>
          </DataTable>
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              account and may affect related transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
