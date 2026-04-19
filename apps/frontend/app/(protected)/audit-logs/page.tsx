"use client";

import { useEffect, useState } from "react";

import { Resource, Action } from "@sas/validators";

import { PermissionGuard } from "@/lib/auth/permission-guard";
import { AuditLogEntry, AuditLogFilters } from "@/lib/services/audit-log.service";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACTION_COLORS: Record<AuditLogEntry["action"], string> = {
  Create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  View: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  Login: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Logout: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Export: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const MODULES = [
  "Invoice",
  "Bill",
  "Payment",
  "Customer",
  "Supplier",
  "JournalEntry",
  "Account",
  "Inventory",
];

const ACTIONS: AuditLogEntry["action"][] = [
  "Create",
  "Update",
  "Delete",
  "View",
  "Login",
  "Logout",
  "Export",
];

function formatDate(ts: string) {
  return new Date(ts).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AuditLogsPage() {
  const { logs, isLoading, total, page, limit, fetchLogs, fetchNextPage, fetchPrevPage } =
    useAuditLogs();

  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchLogs({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters() {
    const f: AuditLogFilters = { page: 1 };
    if (moduleFilter && moduleFilter !== "all") f.module = moduleFilter;
    if (actionFilter && actionFilter !== "all") f.action = actionFilter as AuditLogEntry["action"];
    if (startDate) f.startDate = startDate;
    if (endDate) f.endDate = endDate;
    setFilters(f);
    fetchLogs(f);
  }

  function clearFilters() {
    setModuleFilter("all");
    setActionFilter("all");
    setStartDate("");
    setEndDate("");
    setFilters({});
    fetchLogs({ page: 1 });
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <PermissionGuard resource={Resource.auditLog} action={Action.read}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Track all user activity and data changes across your organization.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Module</span>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Action</span>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">From</span>
            <Input
              type="date"
              className="w-[140px]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">To</span>
            <Input
              type="date"
              className="w-[140px]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <Button onClick={applyFilters} size="sm">
            Apply
          </Button>
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear
          </Button>
        </div>

        {/* Results summary */}
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Loading..."
            : `${total.toLocaleString()} result${total !== 1 ? "s" : ""}`}
        </p>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="w-[90px]">Action</TableHead>
                <TableHead className="w-[130px]">Module</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{log.userName}</div>
                      <div className="text-xs text-muted-foreground">{log.userId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs font-medium ${ACTION_COLORS[log.action] ?? ""}`}
                        variant="outline"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.module}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-40">
                      {log.recordType}/{log.recordId}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => fetchPrevPage(filters)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => fetchNextPage(filters)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
