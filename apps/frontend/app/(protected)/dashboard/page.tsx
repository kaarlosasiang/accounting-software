"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
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
} from "lucide-react"
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
} from "recharts"

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
]

const categoryData = [
    { name: "Consulting", value: 35, amount: 28500, color: "hsl(271, 91%, 65%)" },
    { name: "Development", value: 30, amount: 24400, color: "hsl(217, 91%, 60%)" },
    { name: "Design", value: 20, amount: 16300, color: "hsl(142, 76%, 36%)" },
    { name: "Marketing", value: 15, amount: 12200, color: "hsl(346, 77%, 50%)" },
]

const cashFlowData = [
    { week: "Week 1", inflow: 15000, outflow: 8000 },
    { week: "Week 2", inflow: 18000, outflow: 9500 },
    { week: "Week 3", inflow: 22000, outflow: 11000 },
    { week: "Week 4", inflow: 19000, outflow: 10500 },
]

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
}

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-4">
            {/* Header with Advanced Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
                    <p className="text-muted-foreground">
                        Comprehensive overview of your business finances
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select defaultValue="month">
                        <SelectTrigger className="w-[180px]">
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
                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                    <Button size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Alert Banner */}
            <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">3 invoices are overdue</p>
                        <p className="text-xs text-muted-foreground">
                            Total amount: ₱15,680.00 - Review pending payments
                        </p>
                    </div>
                    <Button variant="outline" size="sm">
                        View Details
                    </Button>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group relative">
                    <div className="absolute inset-0 bg-linear-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 relative">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <div className="rounded-full bg-green-500/10 p-2 group-hover:bg-green-500/20 transition-colors duration-300">
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold">₱85,231.89</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                            <span className="text-green-600 font-medium">+20.1%</span> from last month
                        </p>
                        <Progress value={75} className="mt-3 h-1.5 bg-green-500/10" />
                        <p className="text-xs text-muted-foreground mt-2">75% of yearly goal</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group relative">
                    <div className="absolute inset-0 bg-linear-to-br from-red-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 relative">
                        <CardTitle className="text-sm font-medium">
                            Total Expenses
                        </CardTitle>
                        <div className="rounded-full bg-red-500/10 p-2 group-hover:bg-red-500/20 transition-colors duration-300">
                            <CreditCard className="h-4 w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold">₱46,456.00</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3 text-red-600" />
                            <span className="text-red-600 font-medium">+4.3%</span> from last month
                        </p>
                        <Progress value={54} className="mt-3 h-1.5 bg-red-500/10" />
                        <p className="text-xs text-muted-foreground mt-2">54% of revenue</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group relative">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 relative">
                        <CardTitle className="text-sm font-medium">
                            Net Profit
                        </CardTitle>
                        <div className="rounded-full bg-blue-500/10 p-2 group-hover:bg-blue-500/20 transition-colors duration-300">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold">₱38,775.89</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                            <span className="text-green-600 font-medium">+28.4%</span> from last month
                        </p>
                        <Progress value={85} className="mt-3 h-1.5 bg-blue-500/10" />
                        <p className="text-xs text-muted-foreground mt-2">46% profit margin</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group relative">
                    <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 relative">
                        <CardTitle className="text-sm font-medium">
                            Active Clients
                        </CardTitle>
                        <div className="rounded-full bg-purple-500/10 p-2 group-hover:bg-purple-500/20 transition-colors duration-300">
                            <Users className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                            <span className="text-green-600 font-medium">+35%</span> since last month
                        </p>
                        <Progress value={68} className="mt-3 h-1.5 bg-purple-500/10" />
                        <p className="text-xs text-muted-foreground mt-2">68% retention rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Charts with Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Revenue Chart */}
                        <Card className="col-span-4 overflow-hidden">
                            <CardHeader>
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
                                            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
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
                                            <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
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
                                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
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
                                                stroke: 'hsl(var(--border))',
                                                strokeWidth: 1,
                                                strokeDasharray: '5 5'
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
                                                filter: "url(#shadow)"
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
                                                filter: "url(#shadow)"
                                            }}
                                            animationDuration={2000}
                                            animationBegin={200}
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Category Breakdown */}
                        <Card className="col-span-3 overflow-hidden">
                            <CardHeader>
                                <CardTitle>Revenue by Category</CardTitle>
                                <CardDescription>
                                    Service breakdown for this month
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={{
                                        consulting: {
                                            label: "Consulting",
                                            color: "hsl(271, 91%, 65%)",
                                        },
                                        development: {
                                            label: "Development",
                                            color: "hsl(217, 91%, 60%)",
                                        },
                                        design: {
                                            label: "Design",
                                            color: "hsl(142, 76%, 36%)",
                                        },
                                        marketing: {
                                            label: "Marketing",
                                            color: "hsl(346, 77%, 50%)",
                                        },
                                    }}
                                    className="h-[200px]"
                                >
                                    <RechartsPieChart>
                                        <defs>
                                            <filter id="glow">
                                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur"/>
                                                    <feMergeNode in="SourceGraphic"/>
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
                                                        index === 0 ? "hsl(271, 91%, 65%)" :
                                                        index === 1 ? "hsl(217, 91%, 60%)" :
                                                        index === 2 ? "hsl(142, 76%, 36%)" :
                                                        "hsl(346, 77%, 50%)"
                                                    }
                                                    stroke="hsl(var(--background))"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <ChartTooltip
                                            content={<ChartTooltipContent />}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                    </RechartsPieChart>
                                </ChartContainer>
                                <div className="mt-4 space-y-2">
                                    {categoryData.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-3 w-3 rounded-full shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            index === 0 ? "hsl(271, 91%, 65%)" :
                                                            index === 1 ? "hsl(217, 91%, 60%)" :
                                                            index === 2 ? "hsl(142, 76%, 36%)" :
                                                            "hsl(346, 77%, 50%)"
                                                    }}
                                                />
                                                <span className="text-muted-foreground font-medium">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">₱{item.amount.toLocaleString()}</span>
                                                <Badge variant="secondary" className="text-xs">{item.value}%</Badge>
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
                        <Card className="col-span-4 overflow-hidden">
                            <CardHeader>
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
                                            <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(142, 76%, 45%)" stopOpacity={1}/>
                                                <stop offset="100%" stopColor="hsl(142, 76%, 30%)" stopOpacity={1}/>
                                            </linearGradient>
                                            <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(346, 77%, 55%)" stopOpacity={1}/>
                                                <stop offset="100%" stopColor="hsl(346, 77%, 40%)" stopOpacity={1}/>
                                            </linearGradient>
                                            <filter id="barShadow">
                                                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25"/>
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
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
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
                        <Card className="col-span-3">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Recent Invoices</CardTitle>
                                    <CardDescription>
                                        Latest invoice activities
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-500/10 p-2 rounded-full">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">INV-001</p>
                                                <p className="text-xs text-muted-foreground">Acme Corp</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">₱5,240.00</p>
                                            <Badge variant="outline" className="text-xs text-green-600 mt-1">
                                                Paid
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-yellow-500/10 p-2 rounded-full">
                                                <Clock className="h-4 w-4 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">INV-002</p>
                                                <p className="text-xs text-muted-foreground">Tech Solutions</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">₱3,890.00</p>
                                            <Badge variant="outline" className="text-xs text-yellow-600 mt-1">
                                                Pending
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-500/10 p-2 rounded-full">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">INV-003</p>
                                                <p className="text-xs text-muted-foreground">Global Enterprises</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">₱8,120.00</p>
                                            <Badge variant="outline" className="text-xs text-green-600 mt-1">
                                                Paid
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-red-500/10 p-2 rounded-full">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">INV-004</p>
                                                <p className="text-xs text-muted-foreground">StartUp Inc</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">₱2,450.00</p>
                                            <Badge variant="outline" className="text-xs text-red-600 mt-1">
                                                Overdue
                                            </Badge>
                                        </div>
                                    </div>

                                    <Button variant="outline" className="w-full mt-4">
                                        View All Invoices
                                        <ArrowUpRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle>Profit Trend</CardTitle>
                            <CardDescription>Monthly profit analysis with growth indicators</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[400px]">
                                <LineChart
                                    data={revenueData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="profitGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
                                            <stop offset="50%" stopColor="hsl(271, 91%, 65%)" />
                                            <stop offset="100%" stopColor="hsl(142, 76%, 36%)" />
                                        </linearGradient>
                                        <linearGradient id="profitAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                                        </linearGradient>
                                        <filter id="lineShadow">
                                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4"/>
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
                                            stroke: 'hsl(var(--border))',
                                            strokeWidth: 1,
                                            strokeDasharray: '5 5'
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
                                            stroke: "white"
                                        }}
                                        activeDot={{
                                            r: 8,
                                            fill: "hsl(217, 91%, 60%)",
                                            stroke: "white",
                                            strokeWidth: 3,
                                            filter: "url(#lineShadow)"
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₱3,456</div>
                                <p className="text-xs text-muted-foreground mt-1">Per invoice</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">94.5%</div>
                                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₱24,890</div>
                                <p className="text-xs text-muted-foreground mt-1">Pending collection</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>


            {/* Recent Transactions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>
                            Your latest financial transactions
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </CardHeader>
                <CardContent>
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
                                        <p className="font-medium">Website Development</p>
                                        <p className="text-xs text-muted-foreground">Project milestone payment</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        Income
                                    </Badge>
                                </TableCell>
                                <TableCell>Acme Corp</TableCell>
                                <TableCell className="text-right">
                                    <span className="font-semibold text-green-600">+₱5,240.00</span>
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
                                        <p className="font-medium">Office Supplies</p>
                                        <p className="text-xs text-muted-foreground">Monthly office expenses</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                                        Expense
                                    </Badge>
                                </TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="text-right">
                                    <span className="font-semibold text-red-600">-₱450.00</span>
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
                                        <p className="font-medium">Consulting Services</p>
                                        <p className="text-xs text-muted-foreground">Business consultation - Q4</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        Income
                                    </Badge>
                                </TableCell>
                                <TableCell>Tech Solutions</TableCell>
                                <TableCell className="text-right">
                                    <span className="font-semibold text-green-600">+₱3,890.00</span>
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
                                        <p className="font-medium">Software Subscription</p>
                                        <p className="text-xs text-muted-foreground">Adobe Creative Cloud</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                                        Expense
                                    </Badge>
                                </TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="text-right">
                                    <span className="font-semibold text-red-600">-₱299.00</span>
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
                                        <p className="font-medium">Marketing Campaign</p>
                                        <p className="text-xs text-muted-foreground">Social media campaign management</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        Income
                                    </Badge>
                                </TableCell>
                                <TableCell>Global Enterprises</TableCell>
                                <TableCell className="text-right">
                                    <span className="font-semibold text-green-600">+₱8,120.00</span>
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
                        <p className="text-sm text-muted-foreground">Showing 5 of 247 transactions</p>
                        <Button variant="outline">
                            View All Transactions
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}