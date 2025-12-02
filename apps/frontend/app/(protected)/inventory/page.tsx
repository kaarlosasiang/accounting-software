"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    MoreHorizontal,
    Plus,
    Search,
    Package,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Download,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface InventoryItem {
    id: string
    itemCode: string
    itemName: string
    category: string
    unit: string
    quantityOnHand: number
    reorderLevel: number
    unitCost: number
    sellingPrice: number
    status: "in-stock" | "low-stock" | "out-of-stock"
    lastRestocked: string
}

const mockInventory: InventoryItem[] = [
    {
        id: "INV-001",
        itemCode: "FOOD-001",
        itemName: "Rice (50kg sack)",
        category: "Food",
        unit: "sack",
        quantityOnHand: 150,
        reorderLevel: 50,
        unitCost: 2250.00,
        sellingPrice: 2800.00,
        status: "in-stock",
        lastRestocked: "2025-11-20"
    },
    {
        id: "INV-002",
        itemCode: "FOOD-002",
        itemName: "Cooking Oil (1L)",
        category: "Food",
        unit: "bottle",
        quantityOnHand: 35,
        reorderLevel: 40,
        unitCost: 85.00,
        sellingPrice: 120.00,
        status: "low-stock",
        lastRestocked: "2025-11-15"
    },
    {
        id: "INV-003",
        itemCode: "FOOD-003",
        itemName: "Canned Goods Assorted",
        category: "Food",
        unit: "can",
        quantityOnHand: 0,
        reorderLevel: 30,
        unitCost: 45.00,
        sellingPrice: 65.00,
        status: "out-of-stock",
        lastRestocked: "2025-10-30"
    },
    {
        id: "INV-004",
        itemCode: "NONFOOD-001",
        itemName: "Cleaning Supplies Bundle",
        category: "Non-Food",
        unit: "set",
        quantityOnHand: 200,
        reorderLevel: 100,
        unitCost: 350.00,
        sellingPrice: 500.00,
        status: "in-stock",
        lastRestocked: "2025-11-25"
    },
    {
        id: "INV-005",
        itemCode: "NONFOOD-002",
        itemName: "Office Supplies Pack",
        category: "Non-Food",
        unit: "pack",
        quantityOnHand: 85,
        reorderLevel: 100,
        unitCost: 250.00,
        sellingPrice: 380.00,
        status: "low-stock",
        lastRestocked: "2025-11-18"
    },
]

export default function InventoryPage() {
    const [inventory] = useState<InventoryItem[]>(mockInventory)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterCategory, setFilterCategory] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const filteredInventory = inventory.filter(item => {
        const matchesSearch =
            item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = filterCategory === "all" || item.category === filterCategory
        const matchesStatus = filterStatus === "all" || item.status === filterStatus
        return matchesSearch && matchesCategory && matchesStatus
    })

    const totalItems = inventory.length
    const inStock = inventory.filter(i => i.status === "in-stock").length
    const lowStock = inventory.filter(i => i.status === "low-stock").length
    const outOfStock = inventory.filter(i => i.status === "out-of-stock").length
    const totalValue = inventory.reduce((sum, i) => sum + (i.quantityOnHand * i.unitCost), 0)
    const potentialRevenue = inventory.reduce((sum, i) => sum + (i.quantityOnHand * i.sellingPrice), 0)

    const inStockPct = totalItems > 0 ? ((inStock / totalItems) * 100).toFixed(1) : "0.0"
    const lowStockPct = totalItems > 0 ? ((lowStock / totalItems) * 100).toFixed(1) : "0.0"
    const profitMarginPct = totalValue > 0 ? (((potentialRevenue - totalValue) / totalValue) * 100).toFixed(1) : "0.0"

    const getStatusColor = (status: InventoryItem["status"]) => {
        switch (status) {
            case "in-stock": return "default"
            case "low-stock": return "secondary"
            case "out-of-stock": return "destructive"
            default: return "outline"
        }
    }

    const handleExportCSV = () => {
        const csv = [
            ["Item Code", "Item Name", "Category", "Unit", "Qty On Hand", "Reorder Level", "Unit Cost", "Selling Price", "Status"],
            ...filteredInventory.map(i => [i.itemCode, i.itemName, i.category, i.unit, i.quantityOnHand, i.reorderLevel, i.unitCost, i.sellingPrice, i.status])
        ].map(row => row.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "inventory.csv"
        a.click()
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Inventory Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Track and manage your inventory items and stock levels
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Inventory Item</DialogTitle>
                            <DialogDescription>
                                Add a new item to your inventory system
                            </DialogDescription>
                        </DialogHeader>
                        <div className="text-muted-foreground text-sm">Form coming soon...</div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                        <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
                            <Package className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{inStockPct}% in stock</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Stock</CardTitle>
                        <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
                            <Package className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{inStock}</div>
                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Healthy stock</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                        <div className="rounded-full bg-orange-500/10 p-2.5 group-hover:bg-orange-500/20 transition-colors duration-300 group-hover:scale-110">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{lowStock}</div>
                        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingDown className="h-3 w-3" />
                            <span>{lowStockPct}% need reorder</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(totalValue)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{profitMarginPct}% margin</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Table */}
            <Card className="border border-border/50">
                <CardHeader>
                    <CardTitle>Inventory Items</CardTitle>
                    <CardDescription>
                        View and manage all inventory items
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search inventory..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="Food">Food</SelectItem>
                                    <SelectItem value="Non-Food">Non-Food</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="in-stock">In Stock</SelectItem>
                                    <SelectItem value="low-stock">Low Stock</SelectItem>
                                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={handleExportCSV}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Code</TableHead>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Unit Cost</TableHead>
                                    <TableHead>Selling Price</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInventory.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <span className="font-medium font-mono text-sm">{item.itemCode}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.itemName}</span>
                                                <span className="text-xs text-muted-foreground">{item.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{item.quantityOnHand} {item.unit}</span>
                                                <span className="text-xs text-muted-foreground">Min: {item.reorderLevel}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(item.unitCost)}
                                        </TableCell>
                                        <TableCell className="font-medium text-green-600">
                                            {formatCurrency(item.sellingPrice)}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(item.quantityOnHand * item.unitCost)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(item.status)}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Edit Item</DropdownMenuItem>
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
