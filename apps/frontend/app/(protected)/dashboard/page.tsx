"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/card";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/tabs";
import { Progress } from "@ui/progress";
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
  Users,
  Calendar,
  Download,
  Filter,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

// Sample data for charts
const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
  { month: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
  { month: "Mar", revenue: 48000, expenses: 33000, profit: 15000 },
  { month: "Apr", revenue: 61000, expenses: 38000, profit: 23000 },
  { month: "May", revenue: 55000, expenses: 36000, profit: 19000 },
  { month: "Jun", revenue: 67000, expenses: 40000, profit: 27000 },
  { month: "Jul", revenue: 72000, expenses: 42000, profit: 30000 },
  { month: "Aug", revenue: 68000, expenses: 41000, profit: 27000 },
  { month: "Sep", revenue: 75000, expenses: 43000, profit: 32000 },
  { month: "Oct", revenue: 82000, expenses: 45000, profit: 37000 },
  { month: "Nov", revenue: 78000, expenses: 44000, profit: 34000 },
  { month: "Dec", revenue: 85000, expenses: 46000, profit: 39000 },
];

const categoryData = [
  {
    name: "Services Rendered",
    value: 45,
    amount: 38250,
    color: "hsl(271, 91%, 65%)",
  },
  { name: "Food Sales", value: 30, amount: 25500, color: "hsl(217, 91%, 60%)" },
  {
    name: "Non-Food Sales",
    value: 20,
    amount: 17000,
    color: "hsl(142, 76%, 36%)",
  },
  { name: "Other Income", value: 5, amount: 4250, color: "hsl(346, 77%, 50%)" },
];

const cashFlowData = [
  { week: "Week 1", inflow: 15000, outflow: 8000 },
  { week: "Week 2", inflow: 18000, outflow: 9500 },
  { week: "Week 3", inflow: 22000, outflow: 11000 },
  { week: "Week 4", inflow: 19000, outflow: 10500 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-3))",
  },
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header with Advanced Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive overview of your business finances
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select defaultValue="month">
            <SelectTrigger className="w-[180px] border-border/60 hover:border-border transition-colors">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="hover:bg-accent/50">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button
            size="sm"
            className="shadow-md hover:shadow-lg transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      <Card className="border-yellow-500/50 bg-linear-to-r from-yellow-500/10 via-yellow-500/5 to-transparent shadow-sm">
        <CardContent className="flex items-center gap-3">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              3 invoices are overdue
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total amount: ₱15,680.00 - Review pending payments
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-yellow-500/10 border-yellow-500/30"
          >
            View Details
          </Button>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">₱85,231.89</div>
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                <span>+20.1%</span>
              </div>
              <span className="text-xs text-muted-foreground">
                from last month
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={75} className="h-1.5 bg-green-500/10" />
              <p className="text-xs text-muted-foreground">
                75% of yearly goal (₱113,642)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <div className="rounded-full bg-red-500/10 p-2.5 group-hover:bg-red-500/20 transition-colors duration-300 group-hover:scale-110">
              <CreditCard className="h-4 w-4 text-red-600 dark:text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">₱46,456.00</div>
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                <span>+4.3%</span>
              </div>
              <span className="text-xs text-muted-foreground">
                from last month
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={54} className="h-1.5 bg-red-500/10" />
              <p className="text-xs text-muted-foreground">
                54% of revenue spent
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">₱38,775.89</div>
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                <span>+28.4%</span>
              </div>
              <span className="text-xs text-muted-foreground">
                from last month
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={85} className="h-1.5 bg-blue-500/10" />
              <p className="text-xs text-muted-foreground">46% profit margin</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
            <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">573</div>
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                <span>+35 clients</span>
              </div>
              <span className="text-xs text-muted-foreground">
                since last month
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={68} className="h-1.5 bg-purple-500/10" />
              <p className="text-xs text-muted-foreground">
                68% retention rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Charts with Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-background"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-background"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="data-[state=active]:bg-background"
          >
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue Chart */}
            <Card className="col-span-4 overflow-hidden border-border/50">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>
                  12-month financial performance trend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-full">
                  <AreaChart
                    data={revenueData}
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
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="50%"
                          stopColor="hsl(142, 76%, 36%)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(142, 76%, 36%)"
                          stopOpacity={0.05}
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
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="50%"
                          stopColor="hsl(346, 77%, 50%)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(346, 77%, 50%)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <filter id="shadow">
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation="3"
                          floodOpacity="0.3"
                        />
                      </filter>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                      tickFormatter={(value) => `₱${value / 1000}k`}
                    />
                    <ChartTooltip
                      cursor={{
                        stroke: "hsl(var(--border))",
                        strokeWidth: 1,
                        strokeDasharray: "5 5",
                      }}
                      content={<ChartTooltipContent indicator="line" />}
                      animationDuration={200}
                    />
                    <Area
                      dataKey="revenue"
                      type="monotone"
                      fill="url(#fillRevenue)"
                      fillOpacity={1}
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: "hsl(142, 76%, 36%)",
                        stroke: "white",
                        strokeWidth: 2,
                        filter: "url(#shadow)",
                      }}
                      animationDuration={2000}
                      animationBegin={0}
                    />
                    <Area
                      dataKey="expenses"
                      type="monotone"
                      fill="url(#fillExpenses)"
                      fillOpacity={1}
                      stroke="hsl(346, 77%, 50%)"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: "hsl(346, 77%, 50%)",
                        stroke: "white",
                        strokeWidth: 2,
                        filter: "url(#shadow)",
                      }}
                      animationDuration={2000}
                      animationBegin={200}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="col-span-3 overflow-hidden border-border/50">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>
                  Service breakdown for this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    services: {
                      label: "Services Rendered",
                      color: "hsl(271, 91%, 65%)",
                    },
                    food: {
                      label: "Food Sales",
                      color: "hsl(217, 91%, 60%)",
                    },
                    nonfood: {
                      label: "Non-Food Sales",
                      color: "hsl(142, 76%, 36%)",
                    },
                    other: {
                      label: "Other Income",
                      color: "hsl(346, 77%, 50%)",
                    },
                  }}
                  className="h-[200px]"
                >
                  <RechartsPieChart>
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "hsl(271, 91%, 65%)"
                              : index === 1
                              ? "hsl(217, 91%, 60%)"
                              : index === 2
                              ? "hsl(142, 76%, 36%)"
                              : "hsl(346, 77%, 50%)"
                          }
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      cursor={{ fill: "transparent" }}
                    />
                  </RechartsPieChart>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                  {categoryData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group border border-transparent hover:border-border/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3 w-3 rounded-full shadow-sm ring-2 ring-background group-hover:scale-110 transition-transform"
                          style={{
                            backgroundColor:
                              index === 0
                                ? "hsl(271, 91%, 65%)"
                                : index === 1
                                ? "hsl(217, 91%, 60%)"
                                : index === 2
                                ? "hsl(142, 76%, 36%)"
                                : "hsl(346, 77%, 50%)",
                          }}
                        />
                        <span className="text-muted-foreground font-medium">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          ₱{item.amount.toLocaleString()}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium"
                        >
                          {item.value}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow and Invoices */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Cash Flow Chart */}
            <Card className="col-span-4 overflow-hidden border-border/50">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle>Cash Flow</CardTitle>
                <CardDescription>
                  Weekly inflow vs outflow comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    inflow: {
                      label: "Inflow",
                      color: "hsl(142, 76%, 36%)",
                    },
                    outflow: {
                      label: "Outflow",
                      color: "hsl(346, 77%, 50%)",
                    },
                  }}
                  className="h-full"
                >
                  <BarChart
                    data={cashFlowData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="inflowGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="hsl(142, 76%, 45%)"
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(142, 76%, 30%)"
                          stopOpacity={1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="outflowGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="hsl(346, 77%, 55%)"
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(346, 77%, 40%)"
                          stopOpacity={1}
                        />
                      </linearGradient>
                      <filter id="barShadow">
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation="2"
                          floodOpacity="0.25"
                        />
                      </filter>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="week"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                      tickFormatter={(value) => `₱${value / 1000}k`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                    />
                    <Bar
                      dataKey="inflow"
                      fill="url(#inflowGradient)"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1500}
                      animationBegin={0}
                      filter="url(#barShadow)"
                    />
                    <Bar
                      dataKey="outflow"
                      fill="url(#outflowGradient)"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1500}
                      animationBegin={300}
                      filter="url(#barShadow)"
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card className="col-span-3 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30">
                <div>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>Latest invoice activities</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/10 p-2 rounded-full ring-2 ring-green-500/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">INV-001</p>
                        <p className="text-xs text-muted-foreground">
                          Acme Corp
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₱5,240.00</p>
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600 border-green-500/30 bg-green-500/10 mt-1"
                      >
                        Paid
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-500/10 p-2 rounded-full ring-2 ring-yellow-500/20">
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">INV-002</p>
                        <p className="text-xs text-muted-foreground">
                          Tech Solutions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₱3,890.00</p>
                      <Badge
                        variant="outline"
                        className="text-xs text-yellow-600 border-yellow-500/30 bg-yellow-500/10 mt-1"
                      >
                        Pending
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/10 p-2 rounded-full ring-2 ring-green-500/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">INV-003</p>
                        <p className="text-xs text-muted-foreground">
                          Global Enterprises
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₱8,120.00</p>
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600 border-green-500/30 bg-green-500/10 mt-1"
                      >
                        Paid
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-500/10 p-2 rounded-full ring-2 ring-red-500/20">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">INV-004</p>
                        <p className="text-xs text-muted-foreground">
                          StartUp Inc
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₱2,450.00</p>
                      <Badge
                        variant="outline"
                        className="text-xs text-red-600 border-red-500/30 bg-red-500/10 mt-1"
                      >
                        Overdue
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4 hover:bg-muted/50"
                  >
                    View All Invoices
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="overflow-hidden border-border/50">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle>Profit Trend</CardTitle>
              <CardDescription>
                Monthly profit analysis with growth indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <LineChart
                  data={revenueData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="profitGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
                      <stop offset="50%" stopColor="hsl(271, 91%, 65%)" />
                      <stop offset="100%" stopColor="hsl(142, 76%, 36%)" />
                    </linearGradient>
                    <linearGradient
                      id="profitAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(217, 91%, 60%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(217, 91%, 60%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <filter id="lineShadow">
                      <feDropShadow
                        dx="0"
                        dy="2"
                        stdDeviation="3"
                        floodOpacity="0.4"
                      />
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                    tickFormatter={(value) => `₱${value / 1000}k`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{
                      stroke: "hsl(var(--border))",
                      strokeWidth: 1,
                      strokeDasharray: "5 5",
                    }}
                  />
                  <Area
                    dataKey="profit"
                    type="monotone"
                    fill="url(#profitAreaGradient)"
                    stroke="none"
                    animationDuration={2000}
                    animationBegin={0}
                  />
                  <Line
                    dataKey="profit"
                    type="monotone"
                    stroke="url(#profitGradient)"
                    strokeWidth={4}
                    dot={{
                      fill: "hsl(217, 91%, 60%)",
                      r: 5,
                      strokeWidth: 2,
                      stroke: "white",
                    }}
                    activeDot={{
                      r: 8,
                      fill: "hsl(217, 91%, 60%)",
                      stroke: "white",
                      strokeWidth: 3,
                      filter: "url(#lineShadow)",
                    }}
                    animationDuration={2500}
                    animationBegin={200}
                    filter="url(#lineShadow)"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/50 hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱3,456</div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Per invoice
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Payment Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.5%</div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Last 30 days
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱24,890</div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  Pending collection
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial transactions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="hover:bg-muted/50">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Nov 15, 2025</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">Haircut & Styling Services</p>
                    <p className="text-xs text-muted-foreground">
                      Walk-in customer service
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500/20"
                  >
                    Income
                  </Badge>
                </TableCell>
                <TableCell>Walk-in Client</TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-green-600">+₱850.00</span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Nov 14, 2025</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">Rice Purchase (50kg sacks)</p>
                    <p className="text-xs text-muted-foreground">
                      Inventory restock - Food items
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-red-500/10 text-red-600 border-red-500/20"
                  >
                    Expense
                  </Badge>
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-red-600">
                    -₱11,250.00
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Nov 13, 2025</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">Spa Treatment Package</p>
                    <p className="text-xs text-muted-foreground">
                      Premium spa service
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500/20"
                  >
                    Income
                  </Badge>
                </TableCell>
                <TableCell>Maria Santos</TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-green-600">
                    +₱2,500.00
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="text-yellow-600">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Nov 12, 2025</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">Cleaning Supplies</p>
                    <p className="text-xs text-muted-foreground">
                      Non-food inventory purchase
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-red-500/10 text-red-600 border-red-500/20"
                  >
                    Expense
                  </Badge>
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-red-600">-₱3,500.00</span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Nov 11, 2025</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">Canned Goods Sales</p>
                    <p className="text-xs text-muted-foreground">
                      Food inventory sale - Bulk order
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500/20"
                  >
                    Income
                  </Badge>
                </TableCell>
                <TableCell>Juan Dela Cruz</TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-green-600">
                    +₱3,250.00
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing 5 of 247 transactions
            </p>
            <Button variant="outline">
              View All Transactions
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
