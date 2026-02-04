"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    MoreHorizontal,
    Search,
    Users,
    Building2,
    Mail,
    Phone,
    Plus,
    TrendingUp,
    Download,
} from "lucide-react"
import { CustomerForm } from "@/components/forms/customer-form/form"
import { formatCurrency } from "@/lib/utils"

interface CustomerDisplay {
    id: string
    name: string
    email: string
    phone: string
    company: string
    totalInvoiced: number
    outstandingBalance: number
}

const activeClients: CustomerDisplay[] = [
    {
        id: "CLI-001",
        name: "John Smith",
        email: "john.smith@abccorp.com",
        phone: "+1 (555) 123-4567",
        company: "ABC Corporation",
        totalInvoiced: 15000.00,
        outstandingBalance: 0
    },
    {
        id: "CLI-002",
        name: "Sarah Johnson",
        email: "sarah.j@xyzind.com",
        phone: "+1 (555) 234-5678",
        company: "XYZ Industries",
        totalInvoiced: 8500.00,
        outstandingBalance: 3500.00
    },
    {
        id: "CLI-003",
        name: "Michael Chen",
        email: "m.chen@techsol.com",
        phone: "+1 (555) 345-6789",
        company: "Tech Solutions Ltd",
        totalInvoiced: 25000.00,
        outstandingBalance: 8750.00
    },
    {
        id: "CLI-004",
        name: "Emily Davis",
        email: "emily.d@globalent.com",
        phone: "+1 (555) 456-7890",
        company: "Global Enterprises",
        totalInvoiced: 12000.00,
        outstandingBalance: 2250.00
    },
]

export default function ActiveCustomersPage() {
    const [clients] = useState<CustomerDisplay[]>(activeClients)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const handleExportCSV = () => {
        const csv = [
            ["Client ID", "Name", "Email", "Phone", "Company", "Total Invoiced", "Outstanding Balance"],
            ...filteredClients.map(c => [c.id, c.name, c.email, c.phone, c.company, c.totalInvoiced, c.outstandingBalance])
        ].map(row => row.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "active-clients.csv"
        a.click()
    }

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.company.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    const totalRevenue = clients.reduce((sum, c) => sum + c.totalInvoiced, 0)
    const totalOutstanding = clients.reduce((sum, c) => sum + c.outstandingBalance, 0)
    const avgRevenue = clients.length > 0 ? (totalRevenue / clients.length).toFixed(0) : "0"
    const collectionRate = totalRevenue > 0 ? (((totalRevenue - totalOutstanding) / totalRevenue) * 100).toFixed(1) : "0.0"

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Active Clients</h1>
                    <p className="text-muted-foreground mt-2">
                        Clients with active projects and engagements
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
                                Add a new active client to your system
                            </DialogDescription>
                        </DialogHeader>
                        <CustomerForm onSuccess={() => setIsDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                        <div className="rounded-full bg-green-500/10 p-2.5 group-hover:bg-green-500/20 transition-colors duration-300 group-hover:scale-110">
                            <Users className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{clients.length}</div>
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
                            <span>{((totalOutstanding/totalRevenue)*100).toFixed(1)}% of revenue</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-border/50">
                <CardHeader>
                    <CardTitle>Active Clients</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search clients..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
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
                                            <Badge>active</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Edit Client</DropdownMenuItem>
                                                    <DropdownMenuItem>View Invoices</DropdownMenuItem>
                                                    <DropdownMenuItem>Create Invoice</DropdownMenuItem>
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

