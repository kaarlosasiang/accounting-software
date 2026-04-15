"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { useCurrency } from "@/hooks/use-currency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/card";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { Skeleton } from "@ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ArrowUpRight,
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-2))" },
};

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { formatCurrency: format } = useCurrency();

  const kpis = data?.kpis;
  const outstandingInvoices = data?.outstandingInvoices;
  const outstandingBills = data?.outstandingBills;
  const recentTransactions = data?.recentTransactions ?? [];
  const monthlyTrend = data?.monthlyTrend ?? [];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Your business overview for {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">View Reports</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/invoices/new">New Invoice</Link>
          </Button>
        </div>
      </div>

      {/* Overdue alert */}
      {!isLoading && (outstandingInvoices?.overdueCount ?? 0) > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm font-medium flex-1">
              {outstandingInvoices!.overdueCount} overdue invoice
              {outstandingInvoices!.overdueCount > 1 ? "s" : ""} — review
              pending payments
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-yellow-500/30 hover:bg-yellow-500/10"
              asChild
            >
              <Link href="/invoices?status=Overdue">View</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  YTD Revenue
                </CardTitle>
                <div className="rounded-full bg-green-500/10 p-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {format(kpis?.ytdRevenue ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(kpis?.monthRevenue ?? 0)} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  YTD Expenses
                </CardTitle>
                <div className="rounded-full bg-red-500/10 p-2">
                  <CreditCard className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {format(kpis?.ytdExpenses ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(kpis?.monthExpenses ?? 0)} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
                <div
                  className={`rounded-full p-2 ${(kpis?.ytdProfit ?? 0) >= 0 ? "bg-blue-500/10" : "bg-red-500/10"}`}
                >
                  <TrendingUp
                    className={`h-4 w-4 ${(kpis?.ytdProfit ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${(kpis?.ytdProfit ?? 0) < 0 ? "text-red-600" : ""}`}
                >
                  {format(kpis?.ytdProfit ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(kpis?.monthProfit ?? 0)} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding
                </CardTitle>
                <div className="rounded-full bg-purple-500/10 p-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {format(
                    (outstandingInvoices?.totalBalance ?? 0) +
                      (outstandingBills?.totalBalance ?? 0),
                  )}
                </div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{outstandingInvoices?.count ?? 0} invoices</span>
                  <span>{outstandingBills?.count ?? 0} bills</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart + AR/AP */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>
              12-month trend for {new Date().getFullYear()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : monthlyTrend.every(
                (m) => m.revenue === 0 && m.expenses === 0,
              ) ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                No transaction data yet for this year
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[280px]">
                <AreaChart
                  data={monthlyTrend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="fillRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(142, 76%, 36%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(142, 76%, 36%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fillExpenses"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(346, 77%, 50%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(346, 77%, 50%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    fill="url(#fillRevenue)"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    dataKey="expenses"
                    type="monotone"
                    fill="url(#fillExpenses)"
                    stroke="hsl(346, 77%, 50%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Accounts Receivable
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/invoices">
                    View all <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total outstanding
                    </span>
                    <span className="font-semibold">
                      {format(outstandingInvoices?.totalBalance ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Open invoices</span>
                    <span>{outstandingInvoices?.count ?? 0}</span>
                  </div>
                  {(outstandingInvoices?.overdueCount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overdue</span>
                      <Badge variant="destructive" className="text-xs">
                        {outstandingInvoices!.overdueCount}
                      </Badge>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Accounts Payable
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/bills">
                    View all <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total outstanding
                    </span>
                    <span className="font-semibold">
                      {format(outstandingBills?.totalBalance ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Open bills</span>
                    <span>{outstandingBills?.count ?? 0}</span>
                  </div>
                  {(outstandingBills?.overdueCount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overdue</span>
                      <Badge variant="destructive" className="text-xs">
                        {outstandingBills!.overdueCount}
                      </Badge>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Last 10 ledger entries</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/ledger">View ledger</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No transactions yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm max-w-60 truncate">
                      {tx.description || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-muted-foreground mr-1">
                        {tx.accountCode}
                      </span>
                      {tx.accountName}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {tx.debit > 0 ? format(tx.debit) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {tx.credit > 0 ? format(tx.credit) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
