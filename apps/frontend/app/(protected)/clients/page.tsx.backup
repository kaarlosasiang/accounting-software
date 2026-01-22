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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    Users,
    Mail,
    Phone,
    Building2,
    Eye,
    Edit,
    TrendingUp,
    Download,
} from "lucide-react"
import { ClientForm } from "@/components/forms/client-form/form"
import { formatCurrency } from "@/lib/utils"

interface Address {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
}

interface Client {
    id: string
    customerCode: string
    customerName: string
    displayName: string
    email: string
    phone: string
    billingAddress: Address
    shippingAddress?: Address
    taxId: string
    paymentTerms: string
    creditLimit: number
    currentBalance: number
    status: "active" | "inactive" | "archived"
    totalInvoiced: number
    lastInvoice: string
}

const mockClients: Client[] = [
    {
        id: "CLI-001",
        customerCode: "CUST-001",
        customerName: "Maria's Salon and Spa",
        displayName: "Maria's Salon",
        email: "billing@mariasalon.com",
        phone: "+63 2 1234 5678",
        billingAddress: {
            street: "123 Quezon Avenue",
            city: "Quezon City",
            state: "Metro Manila",
            zipCode: "1100",
            country: "Philippines"
        },
        taxId: "123-456-789-000",
        paymentTerms: "Net 15",
        creditLimit: 25000.00,
        currentBalance: 0,
        status: "active",
        totalInvoiced: 15000.00,
        lastInvoice: "2025-11-25"
    },
    {
        id: "CLI-002",
        customerCode: "CUST-002",
        customerName: "Juan's Grocery Store",
        displayName: "Juan's Grocery",
        email: "accounts@juangrocery.com",
        phone: "+63 2 2345 6789",
        billingAddress: {
            street: "456 Rizal Street",
            city: "Manila",
            state: "Metro Manila",
            zipCode: "1000",
            country: "Philippines"
        },
        taxId: "234-567-890-000",
        paymentTerms: "Net 30",
        creditLimit: 50000.00,
        currentBalance: 12750.00,
        status: "active",
        totalInvoiced: 45000.00,
        lastInvoice: "2025-11-10"
    },
    {
        id: "CLI-003",
        customerCode: "CUST-003",
        customerName: "Tech Solutions Office Complex",
        displayName: "Tech Solutions Office",
        email: "finance@techsol.com",
        phone: "+63 2 3456 7890",
        billingAddress: {
            street: "789 Makati Avenue",
            city: "Makati",
            state: "Metro Manila",
            zipCode: "1200",
            country: "Philippines"
        },
        shippingAddress: {
            street: "789 Makati Avenue, Floor 5",
            city: "Makati",
            state: "Metro Manila",
            zipCode: "1200",
            country: "Philippines"
        },
        taxId: "345-678-901-000",
        paymentTerms: "Net 30",
        creditLimit: 30000.00,
        currentBalance: 5250.00,
        status: "active",
        totalInvoiced: 38000.00,
        lastInvoice: "2025-11-15"
    },
    {
        id: "CLI-004",
        customerCode: "CUST-004",
        customerName: "Beauty Bar Manila",
        displayName: "Beauty Bar Manila",
        email: "ap@beautybar.ph",
        phone: "+63 2 4567 8901",
        billingAddress: {
            street: "321 Ortigas Avenue",
            city: "Pasig",
            state: "Metro Manila",
            zipCode: "1600",
            country: "Philippines"
        },
        taxId: "456-789-012-000",
        paymentTerms: "Net 15",
        creditLimit: 15000.00,
        currentBalance: 1850.00,
        status: "active",
        totalInvoiced: 22000.00,
        lastInvoice: "2025-10-20"
    },
    {
        id: "CLI-005",
        customerCode: "CUST-005",
        customerName: "Pedro's Carinderia",
        displayName: "Pedro's Carinderia",
        email: "billing@pedros.ph",
        phone: "+63 2 5678 9012",
        billingAddress: {
            street: "654 Taft Avenue",
            city: "Manila",
            state: "Metro Manila",
            zipCode: "1004",
            country: "Philippines"
        },
        taxId: "567-890-123-000",
        paymentTerms: "Net 30",
        creditLimit: 35000.00,
        currentBalance: 0,
        status: "inactive",
        totalInvoiced: 18000.00,
        lastInvoice: "2025-09-15"
    },
]

export default function ClientsPage() {
    const [clients] = useState<Client[]>(mockClients)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const handleExportCSV = () => {
        const csv = [
            ["Client ID", "Customer Code", "Name", "Display Name", "Email", "Phone", "Tax ID", "Payment Terms", "Status", "Total Invoiced", "Current Balance", "Credit Limit", "Last Invoice"],
            ...filteredClients.map(c => [c.id, c.customerCode, c.customerName, c.displayName, c.email, c.phone, c.taxId, c.paymentTerms, c.status, c.totalInvoiced, c.currentBalance, c.creditLimit, c.lastInvoice])
        ].map(row => row.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "clients.csv"
        a.click()
    }

    const filteredClients = clients.filter(client => {
        const matchesSearch =
            client.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === "all" || client.status === filterStatus
        const matchesDateRange = (!startDate || new Date(client.lastInvoice) >= new Date(startDate)) &&
                                 (!endDate || new Date(client.lastInvoice) <= new Date(endDate))
        return matchesSearch && matchesStatus && matchesDateRange
    })

    const totalClients = clients.length
    const activeClients = clients.filter(c => c.status === "active").length
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalInvoiced, 0)
    const totalOutstanding = clients.reduce((sum, c) => sum + c.currentBalance, 0)
    
    const activePct = totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : "0.0"
    const collectionRate = totalRevenue > 0 ? (((totalRevenue - totalOutstanding) / totalRevenue) * 100).toFixed(1) : "0.0"
    const avgRevenue = activeClients > 0 ? (totalRevenue / activeClients).toFixed(0) : "0"
    const outstandingPct = totalRevenue > 0 ? ((totalOutstanding / totalRevenue) * 100).toFixed(1) : "0.0"

    const getStatusColor = (status: Client["status"]) => {
        switch (status) {
            case "active": return "default"
            case "inactive": return "secondary"
            case "archived": return "outline"
            default: return "outline"
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Clients</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your client relationships and contacts
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Client
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Client</DialogTitle>
                            <DialogDescription>
                                Add a new client to your accounting system
                            </DialogDescription>
                        </DialogHeader>
                        <ClientForm onSuccess={() => setIsDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                        <div className="rounded-full bg-blue-500/10 p-2.5 group-hover:bg-blue-500/20 transition-colors duration-300 group-hover:scale-110">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{activePct}% active</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                        <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
                            <Users className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeClients}</div>
                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{avgRevenue} avg value</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <div className="rounded-full bg-purple-500/10 p-2.5 group-hover:bg-purple-500/20 transition-colors duration-300 group-hover:scale-110">
                            <Building2 className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(totalRevenue)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{collectionRate}% collected</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                        <div className="rounded-full bg-orange-500/10 p-2.5 group-hover:bg-orange-500/20 transition-colors duration-300 group-hover:scale-110">
                            <Building2 className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(totalOutstanding)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{outstandingPct}% pending</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Clients Table */}
            <Card className="border border-border/50">
                <CardHeader>
                    <CardTitle>All Clients</CardTitle>
                    <CardDescription>
                        View and manage your client information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search clients..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                placeholder="Start Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <Input
                                type="date"
                                placeholder="End Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            <Button variant="outline" onClick={handleExportCSV}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                        {(startDate || endDate) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setStartDate(""); setEndDate(""); }}
                                className="w-fit"
                            >
                                Clear Dates
                            </Button>
                        )}
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Total Invoiced</TableHead>
                                    <TableHead>Outstanding</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{client.displayName}</span>
                                                <span className="text-xs text-muted-foreground">{client.customerCode}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs">{client.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs">{client.phone}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{client.billingAddress.city}, {client.billingAddress.state}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(client.totalInvoiced)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={client.currentBalance > 0 ? "text-orange-600 font-semibold" : "text-muted-foreground"}>
                                                {formatCurrency(client.currentBalance)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(client.status)}>
                                                {client.status}
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
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Client
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        View Invoices
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        Create Invoice
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem>
                                                        {client.status === "active" ? "Mark as Inactive" : "Mark as Active"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        Archive Client
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive">
                                                        Delete Client
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

