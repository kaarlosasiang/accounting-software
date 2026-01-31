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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Search,
    AlertTriangle,
    TrendingDown,
    Download,
    ShoppingCart,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useInventory } from "@/hooks/use-inventory"

interface LowStockItem {
    id: string
    itemCode: string
    itemName: string
    category: string
    unit: string
    quantityOnHand: number
    reorderLevel: number
    deficit: number
    unitCost: number
    reorderCost: number
    daysUntilOut: number
}

export default function LowStockPage() {
    const { items: inventoryItems, isLoading } = useInventory({ lowStockOnly: true, activeOnly: true })
    const [searchQuery, setSearchQuery] = useState("")

    // Transform inventory items to low stock format
    const items: LowStockItem[] = inventoryItems
        .filter(item => item.itemType === "Product")
        .map(item => {
            const deficit = Math.max(0, (item.reorderLevel || 0) - (item.quantityOnHand || 0))
            const reorderQuantity = deficit
            const reorderCost = reorderQuantity * (item.unitCost || 0)
            // Simple estimation: assume 30 days average sales if we had tracking
            const daysUntilOut = item.quantityOnHand === 0 ? 0 : 
                Math.floor((item.quantityOnHand || 0) / ((deficit || 1) / 7)) // Rough estimate

            return {
                id: item._id,
                itemCode: item.sku,
                itemName: item.itemName,
                category: item.category,
                unit: item.unit,
                quantityOnHand: item.quantityOnHand || 0,
                reorderLevel: item.reorderLevel || 0,
                deficit,
                unitCost: item.unitCost || 0,
                reorderCost,
                daysUntilOut: Math.min(daysUntilOut, 90) // Cap at 90 days
            }
        })

    const filteredItems = items.filter(item =>
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalLowStock = items.length
    const totalOutOfStock = items.filter(i => i.quantityOnHand === 0).length
    const totalReorderCost = items.reduce((sum, i) => sum + i.reorderCost, 0)
    const avgDaysUntilOut = items.reduce((sum, i) => sum + i.daysUntilOut, 0) / items.length

    const handleExportCSV = () => {
        const csv = [
            ["Item Code", "Item Name", "Category", "Qty On Hand", "Reorder Level", "Deficit", "Reorder Cost"],
            ...filteredItems.map(i => [i.itemCode, i.itemName, i.category, i.quantityOnHand, i.reorderLevel, i.deficit, i.reorderCost])
        ].map(row => row.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "low-stock-report.csv"
        a.click()
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Low Stock Items</h1>
                    <p className="text-muted-foreground mt-2">
                        Items that need to be reordered
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                        <div className="rounded-full bg-orange-500/10 p-2.5 group-hover:bg-orange-500/20 transition-colors duration-300 group-hover:scale-110">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{totalLowStock}</div>
                        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingDown className="h-3 w-3" />
                            <span>Needs attention</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                        <div className="rounded-full bg-red-500/10 p-2.5 group-hover:bg-red-500/20 transition-colors duration-300 group-hover:scale-110">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{totalOutOfStock}</div>
                        <div className="flex items-center gap-1 text-xs text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Critical</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reorder Cost</CardTitle>
                        <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
                            <ShoppingCart className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(totalReorderCost)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <ShoppingCart className="h-3 w-3" />
                            <span>To restock</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Days Until Out</CardTitle>
                        <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
                            <TrendingDown className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{avgDaysUntilOut.toFixed(0)}</div>
                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingDown className="h-3 w-3" />
                            <span>Days remaining</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Table */}
            <Card className="border border-border/50">
                <CardHeader>
                    <CardTitle>Items Needing Reorder</CardTitle>
                    <CardDescription>
                        Items below reorder level or out of stock
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading low stock items...</p>
                            </div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-lg font-medium">No low stock items</p>
                                <p className="text-muted-foreground">All items are well stocked!</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-4 mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search items..."
                                            className="pl-8"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" onClick={handleExportCSV}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Report
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Current Stock</TableHead>
                                            <TableHead>Reorder Level</TableHead>
                                            <TableHead>Deficit</TableHead>
                                            <TableHead>Reorder Cost</TableHead>
                                            <TableHead>Days Until Out</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                {filteredItems.map((item) => (
                                    <TableRow key={item.id} className={item.quantityOnHand === 0 ? "bg-red-50 dark:bg-red-950/20" : ""}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.itemName}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{item.itemCode}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={item.quantityOnHand === 0 ? "text-red-600 font-bold" : "font-semibold"}>
                                                {item.quantityOnHand} {item.unit}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground">{item.reorderLevel} {item.unit}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-orange-600 font-semibold">{item.deficit} {item.unit}</span>
                                        </TableCell>
                                        <TableCell className="font-semibold text-purple-600">
                                            {formatCurrency(item.reorderCost)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.daysUntilOut === 0 ? "destructive" : item.daysUntilOut < 10 ? "secondary" : "outline"}>
                                                {item.daysUntilOut === 0 ? "Out Now" : `${item.daysUntilOut} days`}
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
                                                    <DropdownMenuItem>
                                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                                        Reorder Now
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Adjust Reorder Level</DropdownMenuItem>
                                                    <DropdownMenuItem>View Transactions</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
}
