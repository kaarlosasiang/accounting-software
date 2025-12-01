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

interface Client {
    id: string
    name: string
    email: string
    phone: string
    company: string
    status: "active" | "inactive" | "archived"
    totalInvoiced: number
    outstandingBalance: number
    lastInvoice: string
}

const mockClients: Client[] = [
    {
        id: "CLI-001",
        name: "John Smith",
        email: "john.smith@abccorp.com",
        phone: "+1 (555) 123-4567",
        company: "ABC Corporation",
        status: "active",
        totalInvoiced: 15000.00,
        outstandingBalance: 0,
        lastInvoice: "2025-11-01"
    },
    {
        id: "CLI-002",
        name: "Sarah Johnson",
        email: "sarah.j@xyzind.com",
        phone: "+1 (555) 234-5678",
        company: "XYZ Industries",
        status: "active",
        totalInvoiced: 8500.00,
        outstandingBalance: 3500.00,
        lastInvoice: "2025-11-10"
    },
    {
        id: "CLI-003",
        name: "Michael Chen",
        email: "m.chen@techsol.com",
        phone: "+1 (555) 345-6789",
        company: "Tech Solutions Ltd",
        status: "active",
        totalInvoiced: 25000.00,
        outstandingBalance: 8750.00,
        lastInvoice: "2025-11-15"
    },
    {
        id: "CLI-004",
        name: "Emily Davis",
        email: "emily.d@globalent.com",
        phone: "+1 (555) 456-7890",
        company: "Global Enterprises",
        status: "active",
        totalInvoiced: 12000.00,
        outstandingBalance: 2250.00,
        lastInvoice: "2025-10-20"
    },
    {
        id: "CLI-005",
        name: "David Wilson",
        email: "david@startup.io",
        phone: "+1 (555) 567-8901",
        company: "Startup Inc",
        status: "inactive",
        totalInvoiced: 5000.00,
        outstandingBalance: 0,
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
            ["Client ID", "Name", "Email", "Phone", "Company", "Status", "Total Invoiced", "Outstanding Balance", "Last Invoice"],
            ...filteredClients.map(c => [c.id, c.name, c.email, c.phone, c.company, c.status, c.totalInvoiced, c.outstandingBalance, c.lastInvoice])
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
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === "all" || client.status === filterStatus
        const matchesDateRange = (!startDate || new Date(client.lastInvoice) >= new Date(startDate)) &&
                                 (!endDate || new Date(client.lastInvoice) <= new Date(endDate))
        return matchesSearch && matchesStatus && matchesDateRange
    })

    const totalClients = clients.length
    const activeClients = clients.filter(c => c.status === "active").length
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalInvoiced, 0)
    const totalOutstanding = clients.reduce((sum, c) => sum + c.outstandingBalance, 0)
    
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
                                                <span className="font-medium">{client.name}</span>
                                                <span className="text-xs text-muted-foreground">{client.id}</span>
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
                                                <span>{client.company}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(client.totalInvoiced)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={client.outstandingBalance > 0 ? "text-orange-600 font-semibold" : "text-muted-foreground"}>
                                                {formatCurrency(client.outstandingBalance)}
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

