"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, DollarSign } from "lucide-react"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts"

const revenueData = [
    { month: "Jan", revenue: 45000, expenses: 12000, profit: 33000 },
    { month: "Feb", revenue: 52000, expenses: 14000, profit: 38000 },
    { month: "Mar", revenue: 48000, expenses: 13000, profit: 35000 },
    { month: "Apr", revenue: 61000, expenses: 15000, profit: 46000 },
    { month: "May", revenue: 55000, expenses: 14500, profit: 40500 },
    { month: "Jun", revenue: 67000, expenses: 16000, profit: 51000 },
    { month: "Jul", revenue: 72000, expenses: 17000, profit: 55000 },
    { month: "Aug", revenue: 69000, expenses: 16500, profit: 52500 },
    { month: "Sep", revenue: 78000, expenses: 18000, profit: 60000 },
    { month: "Oct", revenue: 84000, expenses: 19000, profit: 65000 },
    { month: "Nov", revenue: 88700, expenses: 19500, profit: 69200 },
]

const categoryData = [
    { category: "Professional Services", amount: 45000 },
    { category: "Consulting", amount: 28500 },
    { category: "Recurring Revenue", amount: 15200 },
    { category: "Project Work", amount: 22000 },
]

const expenseData = [
    { category: "Office Expenses", amount: 3450 },
    { category: "Software & Tools", amount: 1299 },
    { category: "Professional Services", amount: 2800 },
    { category: "Marketing", amount: 4200 },
    { category: "Travel", amount: 1850 },
]

export default function AnalyticsPage() {
    return (
        <div className="flex flex-col gap-6 pb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                        Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Detailed insights and analytics for your business
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Select defaultValue="year">
                        <SelectTrigger className="w-40 border-border/60 hover:border-border transition-colors">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="quarter">This Quarter</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="hover:bg-accent/50">
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                    <Button size="sm" className="shadow-md hover:shadow-lg transition-all">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Generate Report
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold">$697,700</div>
                        <div className="flex items-center gap-1 mt-2">
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                                <TrendingUp className="h-3 w-3" />
                                <span>+12.5%</span>
                            </div>
                            <span className="text-xs text-muted-foreground">from last year</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                        <div className="rounded-full bg-red-500/10 p-2.5 group-hover:bg-red-500/20 transition-colors duration-300 group-hover:scale-110">
                            <DollarSign className="h-4 w-4 text-red-600 dark:text-red-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold">$169,550</div>
                        <div className="flex items-center gap-1 mt-2">
                            <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">
                                <TrendingUp className="h-3 w-3" />
                                <span>+8.2%</span>
                            </div>
                            <span className="text-xs text-muted-foreground">from last year</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                        <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
                            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold">$528,150</div>
                        <div className="flex items-center gap-1 mt-2">
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                                <TrendingUp className="h-3 w-3" />
                                <span>+14.3%</span>
                            </div>
                            <span className="text-xs text-muted-foreground">from last year</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
                        <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
                            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold">75.7%</div>
                        <div className="flex items-center gap-1 mt-2">
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                                <TrendingUp className="h-3 w-3" />
                                <span>+1.3%</span>
                            </div>
                            <span className="text-xs text-muted-foreground">from last year</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="revenue" className="data-[state=active]:bg-background">Revenue Analysis</TabsTrigger>
                    <TabsTrigger value="income" className="data-[state=active]:bg-background">Income Breakdown</TabsTrigger>
                    <TabsTrigger value="expenses" className="data-[state=active]:bg-background">Expense Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-4">
                    <Card className="border-border/50">
                        <CardHeader className="border-b border-border/50 bg-muted/30">
                            <CardTitle>Revenue vs Expenses vs Profit</CardTitle>
                            <CardDescription>
                                Monthly comparison of revenue, expenses, and profit
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
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
                                }}
                                className="h-[400px]"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                                        <Line type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                                        <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="income" className="space-y-4">
                    <Card className="border-border/50">
                        <CardHeader className="border-b border-border/50 bg-muted/30">
                            <CardTitle>Income by Category</CardTitle>
                            <CardDescription>
                                Revenue breakdown by service category
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    amount: {
                                        label: "Amount",
                                        color: "hsl(var(--chart-1))",
                                    },
                                }}
                                className="h-[400px]"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="category" />
                                        <YAxis />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expenses" className="space-y-4">
                    <Card className="border-border/50">
                        <CardHeader className="border-b border-border/50 bg-muted/30">
                            <CardTitle>Expense by Category</CardTitle>
                            <CardDescription>
                                Expense breakdown by category
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    amount: {
                                        label: "Amount",
                                        color: "hsl(var(--chart-2))",
                                    },
                                }}
                                className="h-[400px]"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expenseData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="category" />
                                        <YAxis />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="amount" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

