"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Plus, Search, Building2, Download, Eye, Edit, Trash, TrendingUp, TrendingDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"

interface Supplier {
    id: string
    supplierCode: string
    supplierName: string
    displayName: string
    email: string
    phone: string
    address: {
        street: string
        city: string
        state: string
        zipCode: string
        country: string
    }
    taxId: string
    paymentTerms: string
    currentBalance: number
    isActive: boolean
    category: "Food" | "Non-Food" | "Supplies" | "Services"
}

const mockSuppliers: Supplier[] = [
    {
        id: "SUP-001",
        supplierCode: "MRT-2025",
        supplierName: "Manila Rice Trading Co.",
        displayName: "Manila Rice Trading",
        email: "accounts@manilarice.com",
        phone: "+63 2 1234 5678",
        address: {
            street: "123 Rizal Avenue",
            city: "Manila",
            state: "Metro Manila",
            zipCode: "1000",
            country: "Philippines"
        },
        taxId: "123-456-789-000",
        paymentTerms: "Net 30",
        currentBalance: 0,
        isActive: true,
        category: "Food"
    },
    {
        id: "SUP-002",
        supplierCode: "MCS-2025",
        supplierName: "Metro Cleaning Supplies Inc.",
        displayName: "Metro Cleaning Supplies",
        email: "billing@metrocleaning.ph",
        phone: "+63 2 9876 5432",
        address: {
            street: "456 Quezon Boulevard",
            city: "Quezon City",
            state: "Metro Manila",
            zipCode: "1100",
            country: "Philippines"
        },
        taxId: "234-567-890-000",
        paymentTerms: "Net 30",
        currentBalance: 3500.00,
        isActive: true,
        category: "Non-Food"
    },
    {
        id: "SUP-003",
        supplierCode: "BPW-2025",
        supplierName: "Beauty Products Wholesalers Corp.",
        displayName: "Beauty Products Wholesalers",
        email: "sales@beautyproducts.ph",
        phone: "+63 2 5555 1234",
        address: {
            street: "789 Makati Avenue",
            city: "Makati",
            state: "Metro Manila",
            zipCode: "1200",
            country: "Philippines"
        },
        taxId: "345-678-901-000",
        paymentTerms: "Net 15",
        currentBalance: 5250.00,
        isActive: true,
        category: "Supplies"
    },
    {
        id: "SUP-004",
        supplierCode: "QCG-2025",
        supplierName: "Quick Canned Goods Distributor",
        displayName: "Quick Canned Goods",
        email: "accounts@quickcanned.com",
        phone: "+63 2 7777 8888",
        address: {
            street: "321 Commonwealth Avenue",
            city: "Quezon City",
            state: "Metro Manila",
            zipCode: "1101",
            country: "Philippines"
        },
        taxId: "456-789-012-000",
        paymentTerms: "Net 30",
        currentBalance: 3250.00,
        isActive: true,
        category: "Food"
    },
    {
        id: "SUP-005",
        supplierCode: "ODM-2025",
        supplierName: "Office Depot Manila",
        displayName: "Office Depot",
        email: "billing@officedepot.ph",
        phone: "+63 2 3333 4444",
        address: {
            street: "654 Ortigas Avenue",
            city: "Pasig",
            state: "Metro Manila",
            zipCode: "1600",
            country: "Philippines"
        },
        taxId: "567-890-123-000",
        paymentTerms: "Net 30",
        currentBalance: 0,
        isActive: false,
        category: "Non-Food"
    },
]

export default function SuppliersPage() {
    const [suppliers] = useState<Supplier[]>(mockSuppliers)
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")

    const filteredSuppliers = suppliers.filter((supplier) => {
        const matchesSearch =
            supplier.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.supplierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory = categoryFilter === "all" || supplier.category === categoryFilter

        return matchesSearch && matchesCategory
    })

    const activeSuppliers = suppliers.filter(s => s.isActive).length
    const totalBalance = suppliers.reduce((sum, s) => sum + s.currentBalance, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                        Suppliers
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your supplier relationships
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Link href="/suppliers/create">
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Supplier
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{suppliers.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeSuppliers} active
                        </p>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600 group-hover:text-green-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSuppliers}</div>
                        <p className="text-xs text-muted-foreground">
                            {((activeSuppliers / suppliers.length) * 100).toFixed(0)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600 group-hover:text-red-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                        <p className="text-xs text-muted-foreground">
                            Outstanding balance
                        </p>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Payment Terms</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Net 30</div>
                        <p className="text-xs text-muted-foreground">
                            Standard terms
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div>
                            <CardTitle>All Suppliers</CardTitle>
                            <CardDescription>
                                View and manage supplier information
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search suppliers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="Food">Food</SelectItem>
                                    <SelectItem value="Non-Food">Non-Food</SelectItem>
                                    <SelectItem value="Supplies">Supplies</SelectItem>
                                    <SelectItem value="Services">Services</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Supplier Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Payment Terms</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSuppliers.map((supplier) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">{supplier.supplierCode}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{supplier.displayName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {supplier.address.city}, {supplier.address.state}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                supplier.category === "Supplies" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                                supplier.category === "Food" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                supplier.category === "Services" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                                                "bg-green-500/10 text-green-600 border-green-500/20"
                                            }>
                                                {supplier.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{supplier.email}</span>
                                                <span className="text-xs text-muted-foreground">{supplier.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{supplier.paymentTerms}</TableCell>
                                        <TableCell className="font-medium">
                                            {supplier.currentBalance > 0 ? (
                                                <span className="text-red-600">{formatCurrency(supplier.currentBalance)}</span>
                                            ) : (
                                                <span className="text-green-600">{formatCurrency(0)}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                supplier.isActive 
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20" 
                                                    : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                                            }>
                                                {supplier.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600">
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Delete
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
