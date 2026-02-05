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
    MoreHorizontal,
    Search,
    Archive,
    Building2,
    Mail,
    TrendingUp,
    Download,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface CustomerDisplay {
    id: string
    name: string
    email: string
    company: string
    totalInvoiced: number
    archivedDate: string
}

const archivedClients: CustomerDisplay[] = [
    {
        id: "CLI-005",
        name: "David Wilson",
        email: "david@startup.io",
        company: "Startup Inc",
        totalInvoiced: 5000.00,
        archivedDate: "2025-10-01"
    },
]

export default function ArchivedCustomersPage() {
    const [clients] = useState<CustomerDisplay[]>(archivedClients)
    const [searchQuery, setSearchQuery] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const handleExportCSV = () => {
        const csv = [
            ["Client ID", "Name", "Email", "Company", "Total Invoiced", "Archived Date"],
            ...filteredClients.map(c => [c.id, c.name, c.email, c.company, c.totalInvoiced, c.archivedDate])
        ].map(row => row.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "archived-clients.csv"
        a.click()
    }

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.company.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesDateRange = (!startDate || new Date(client.archivedDate) >= new Date(startDate)) &&
                                 (!endDate || new Date(client.archivedDate) <= new Date(endDate))
        return matchesSearch && matchesDateRange
    })

    const totalRevenue = clients.reduce((sum, c) => sum + c.totalInvoiced, 0)
    const avgRevenue = clients.length > 0 ? (totalRevenue / clients.length).toFixed(0) : "0"

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Archived Clients</h1>
                    <p className="text-muted-foreground mt-2">
                        Past clients and completed projects
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-gray-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Archived Clients</CardTitle>
                        <div className="rounded-full bg-gray-500/10 p-2.5 group-hover:bg-gray-500/20 transition-colors duration-300 group-hover:scale-110">
                            <Archive className="h-4 w-4 text-gray-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{clients.length}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
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
                            <span>From archived</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-border/50">
                <CardHeader>
                    <CardTitle>Archived Clients</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search archived clients..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
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
                                    <TableHead>Email</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Total Invoiced</TableHead>
                                    <TableHead>Archived Date</TableHead>
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
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{client.email}</span>
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
                                        <TableCell>{new Date(client.archivedDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">archived</Badge>
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
                                                    <DropdownMenuItem>View History</DropdownMenuItem>
                                                    <DropdownMenuItem>Restore Client</DropdownMenuItem>
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

