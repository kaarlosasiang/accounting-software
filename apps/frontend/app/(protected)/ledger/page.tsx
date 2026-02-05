"use client";

import { useState } from "react";
import { useGeneralLedger, useTrialBalance } from "@/hooks/use-journal-entries";
import { useAccounts } from "@/hooks/use-accounts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default function GeneralLedgerPage() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(),
  );

  const { data: accounts } = useAccounts();
  const { data: generalLedger, isLoading: isLoadingGL } = useGeneralLedger(
    startDate || undefined,
    endDate || undefined,
  );
  const { data: trialBalance, isLoading: isLoadingTB } = useTrialBalance(
    endDate || undefined,
  );

  const toggleAccount = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const filteredLedger = generalLedger?.filter(
    (item) => selectedAccount === "all" || item.account._id === selectedAccount,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
              General Ledger
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Complete transaction history for all accounts
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Account</label>
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.accountCode} - {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for General Ledger and Trial Balance */}
      <Tabs defaultValue="general-ledger" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general-ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
        </TabsList>

        {/* General Ledger Tab */}
        <TabsContent value="general-ledger" className="space-y-4">
          {isLoadingGL ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : filteredLedger && filteredLedger.length > 0 ? (
            <div className="space-y-4">
              {filteredLedger.map((accountLedger) => (
                <Card key={accountLedger.account._id}>
                  <Collapsible
                    open={expandedAccounts.has(accountLedger.account._id)}
                    onOpenChange={() =>
                      toggleAccount(accountLedger.account._id)
                    }
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedAccounts.has(accountLedger.account._id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                            <div className="text-left">
                              <CardTitle>
                                {accountLedger.account.accountCode} -{" "}
                                {accountLedger.account.accountName}
                              </CardTitle>
                              <CardDescription>
                                {accountLedger.account.accountType} •{" "}
                                {accountLedger.summary.entryCount} entries
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Total Debit
                              </p>
                              <p className="font-semibold">
                                {formatCurrency(
                                  accountLedger.summary.totalDebit,
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Total Credit
                              </p>
                              <p className="font-semibold">
                                {formatCurrency(
                                  accountLedger.summary.totalCredit,
                                )}
                              </p>
                            </div>
                            <div className="text-right min-w-[120px]">
                              <p className="text-sm text-muted-foreground">
                                Balance
                              </p>
                              <p className="font-semibold text-primary">
                                {formatCurrency(accountLedger.summary.balance)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Entry Number</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">
                                Debit
                              </TableHead>
                              <TableHead className="text-right">
                                Credit
                              </TableHead>
                              <TableHead className="text-right">
                                Balance
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accountLedger.entries.map((entry) => (
                              <TableRow key={entry._id}>
                                <TableCell>
                                  {format(
                                    new Date(entry.transactionDate),
                                    "MMM d, yyyy",
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {entry.entryNumber}
                                </TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell className="text-right">
                                  {parseFloat(entry.debit) > 0
                                    ? formatCurrency(parseFloat(entry.debit))
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {parseFloat(entry.credit) > 0
                                    ? formatCurrency(parseFloat(entry.credit))
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(entry.runningBalance)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  No ledger entries found
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {startDate || endDate
                    ? "Try adjusting your date filters"
                    : "Post some journal entries to see them here"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trial Balance Tab */}
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trial Balance</CardTitle>
                  <CardDescription>
                    {trialBalance?.asOfDate
                      ? `As of ${format(new Date(trialBalance.asOfDate), "MMMM d, yyyy")}`
                      : "Current balances"}
                  </CardDescription>
                </div>
                {trialBalance?.totals.balanced ? (
                  <Badge variant="default" className="bg-green-600">
                    ✓ Balanced
                  </Badge>
                ) : (
                  <Badge variant="destructive">✗ Out of Balance</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTB ? (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : trialBalance ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance.accounts.map((account) => (
                        <TableRow key={account.accountCode}>
                          <TableCell className="font-medium">
                            {account.accountCode}
                          </TableCell>
                          <TableCell>{account.accountName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {account.accountType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {account.debit > 0
                              ? formatCurrency(account.debit)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {account.credit > 0
                              ? formatCurrency(account.credit)
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(trialBalance.totals.debits)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(trialBalance.totals.credits)}
                        </TableCell>
                      </TableRow>
                      {trialBalance.totals.difference > 0 && (
                        <TableRow className="text-destructive">
                          <TableCell colSpan={3}>Difference</TableCell>
                          <TableCell
                            colSpan={2}
                            className="text-right font-semibold"
                          >
                            {formatCurrency(trialBalance.totals.difference)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
