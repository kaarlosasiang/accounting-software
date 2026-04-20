"use client";

import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/card";
import { Progress } from "@ui/progress";
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
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  FileText,
  Package,
  Percent,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useCurrency } from "@/hooks/use-currency";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-2))" },
};

function KpiSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-muted" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-36 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string; // tailwind gradient class for top bar
  valueClass?: string;
  badge?: React.ReactNode;
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
  valueClass,
  badge,
}: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className={cn("h-1 w-full", accent)} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
        <div className="rounded-lg bg-muted p-1.5">{icon}</div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className={cn("text-2xl font-bold tracking-tight", valueClass)}>
          {value}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{sub}</p>
          {badge}
        </div>
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

  const profitMargin =
    (kpis?.ytdRevenue ?? 0) > 0
      ? ((kpis!.ytdProfit / kpis!.ytdRevenue) * 100).toFixed(1)
      : null;
  const ytdRoi = kpis?.ytdRoi;

  const arOverdueRatio =
    (outstandingInvoices?.count ?? 0) > 0
      ? (outstandingInvoices!.overdueCount / outstandingInvoices!.count) * 100
      : 0;

  const apOverdueRatio =
    (outstandingBills?.count ?? 0) > 0
      ? (outstandingBills!.overdueCount / outstandingBills!.count) * 100
      : 0;

  const quickActions = [
    {
      label: "New Invoice",
      href: "/invoices/new",
      icon: <FileText className="h-4 w-4" />,
      description: "Bill a customer",
    },
    {
      label: "New Bill",
      href: "/bills/new",
      icon: <Receipt className="h-4 w-4" />,
      description: "Record a payable",
    },
    {
      label: "Journal Entry",
      href: "/journal-entries/new",
      icon: <BookOpen className="h-4 w-4" />,
      description: "Manual JE",
    },
    {
      label: "New Customer",
      href: "/customers/new",
      icon: <Users className="h-4 w-4" />,
      description: "Add a customer",
    },
    {
      label: "Add Item",
      href: "/inventory/new",
      icon: <Package className="h-4 w-4" />,
      description: "Inventory item",
    },
    {
      label: "View Reports",
      href: "/reports",
      icon: <BarChart3 className="h-4 w-4" />,
      description: "Financial reports",
    },
  ];

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
            <Link href="/invoices/new">
              <Plus className="h-4 w-4 mr-1" /> New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              label="YTD Revenue"
              value={format(kpis?.ytdRevenue ?? 0)}
              sub={`${format(kpis?.monthRevenue ?? 0)} this month`}
              accent="bg-linear-to-r from-emerald-500 to-emerald-400"
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
            />
            <KpiCard
              label="YTD Expenses"
              value={format(kpis?.ytdExpenses ?? 0)}
              sub={`${format(kpis?.monthExpenses ?? 0)} this month`}
              accent="bg-linear-to-r from-rose-500 to-rose-400"
              icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
            />
            <KpiCard
              label="Net Profit"
              value={format(kpis?.ytdProfit ?? 0)}
              sub={`${format(kpis?.monthProfit ?? 0)} this month`}
              accent={
                (kpis?.ytdProfit ?? 0) >= 0
                  ? "bg-linear-to-r from-blue-500 to-blue-400"
                  : "bg-linear-to-r from-red-500 to-red-400"
              }
              icon={
                (kpis?.ytdProfit ?? 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )
              }
              valueClass={(kpis?.ytdProfit ?? 0) < 0 ? "text-red-600" : ""}
              badge={
                profitMargin !== null ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs px-1.5 py-0",
                      Number(profitMargin) >= 0
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : "bg-red-500/10 text-red-700 dark:text-red-400",
                    )}
                  >
                    {profitMargin}% margin
                  </Badge>
                ) : null
              }
            />
            <KpiCard
              label="Outstanding"
              value={format(
                (outstandingInvoices?.totalBalance ?? 0) +
                  (outstandingBills?.totalBalance ?? 0),
              )}
              sub={`${outstandingInvoices?.count ?? 0} invoices · ${outstandingBills?.count ?? 0} bills`}
              accent="bg-linear-to-r from-violet-500 to-violet-400"
              icon={<FileText className="h-4 w-4 text-violet-600" />}
              badge={
                (outstandingInvoices?.overdueCount ?? 0) > 0 ? (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {outstandingInvoices!.overdueCount} overdue
                  </Badge>
                ) : undefined
              }
            />
            <KpiCard
              label="Period ROI"
              value={ytdRoi !== null && ytdRoi !== undefined ? `${ytdRoi.toFixed(1)}%` : "N/A"}
              sub={`vs ${format(kpis?.totalOwnerCapitalContributions ?? 0)} capital`}
              accent="bg-linear-to-r from-amber-500 to-orange-400"
              icon={<Percent className="h-4 w-4 text-amber-600" />}
              valueClass={
                ytdRoi !== null && ytdRoi !== undefined && ytdRoi < 0
                  ? "text-red-600"
                  : ""
              }
              badge={
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  YTD
                </Badge>
              }
            />
          </>
        )}
      </div>

      {/* Overdue alert */}
      {!isLoading && (outstandingInvoices?.overdueCount ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm flex-1">
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {outstandingInvoices!.overdueCount} overdue invoice
              {outstandingInvoices!.overdueCount > 1 ? "s" : ""}
            </span>
            <span className="text-muted-foreground ml-1">
              — {format(outstandingInvoices!.totalBalance)} at risk
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
            asChild
          >
            <Link href="/invoices?status=Overdue">Review</Link>
          </Button>
        </div>
      )}

      {/* Chart + AR/AP */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>
                  Monthly trend for {new Date().getFullYear()}
                </CardDescription>
              </div>
              {!isLoading && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Revenue
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                    Expenses
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : monthlyTrend.every(
                (m) => m.revenue === 0 && m.expenses === 0,
              ) ? (
              <div className="h-[260px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <BarChart3 className="h-10 w-10 opacity-20" />
                <p className="text-sm">No transaction data yet for this year</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[260px]">
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
                        stopOpacity={0.25}
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
                        stopOpacity={0.25}
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
                    opacity={0.2}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
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
          {/* AR + AP combined */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Receivables & Payables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-1 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : (
                <>
                  {/* AR */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-emerald-500/10 p-1.5">
                          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium">
                          Accounts Receivable
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        asChild
                      >
                        <Link href="/invoices">
                          View <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {outstandingInvoices?.count ?? 0} open invoices
                      </span>
                      <span className="font-semibold">
                        {format(outstandingInvoices?.totalBalance ?? 0)}
                      </span>
                    </div>
                    {(outstandingInvoices?.overdueCount ?? 0) > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {outstandingInvoices!.overdueCount} overdue
                          </span>
                          <span>{arOverdueRatio.toFixed(0)}%</span>
                        </div>
                        <Progress
                          value={arOverdueRatio}
                          className="h-1.5 [&>div]:bg-red-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t" />

                  {/* AP */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-rose-500/10 p-1.5">
                          <ArrowUpLeft className="h-3.5 w-3.5 text-rose-600" />
                        </div>
                        <span className="text-sm font-medium">
                          Accounts Payable
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        asChild
                      >
                        <Link href="/bills">
                          View <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {outstandingBills?.count ?? 0} open bills
                      </span>
                      <span className="font-semibold">
                        {format(outstandingBills?.totalBalance ?? 0)}
                      </span>
                    </div>
                    {(outstandingBills?.overdueCount ?? 0) > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{outstandingBills!.overdueCount} overdue</span>
                          <span>{apOverdueRatio.toFixed(0)}%</span>
                        </div>
                        <Progress
                          value={apOverdueRatio}
                          className="h-1.5 [&>div]:bg-red-500"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex flex-col items-center gap-1.5 rounded-lg border bg-muted/30 p-2.5 text-center transition-colors hover:bg-muted hover:border-primary/30"
                  >
                    <div className="rounded-md bg-background p-1.5 shadow-sm">
                      {action.icon}
                    </div>
                    <span className="text-xs font-medium leading-tight">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Last 10 ledger entries</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/ledger">
              View ledger <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0 px-6 pb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 border-b last:border-0"
                >
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No transactions yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right pr-6">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="pl-6 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-sm max-w-56 truncate">
                      {tx.description || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 font-mono"
                        >
                          {tx.accountCode}
                        </Badge>
                        <span className="text-muted-foreground truncate max-w-24">
                          {tx.accountName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium pr-2">
                      {tx.debit > 0 ? (
                        <span className="text-foreground">
                          {format(tx.debit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium pr-6">
                      {tx.credit > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {format(tx.credit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
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
