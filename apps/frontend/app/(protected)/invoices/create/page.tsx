"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceForm } from "@/components/forms/invoice-form/form"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CreateInvoicePage() {
    const router = useRouter()

    const handleSuccess = () => {
        router.push("/invoices")
    }

    return (
        <div className="flex flex-col gap-6 pb-8">
            <div className="flex items-center gap-4">
                <Link href="/invoices">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Create Invoice</h1>
                    <p className="text-muted-foreground mt-1">Create a new invoice for your client</p>
                </div>
            </div>

            <Card className="border-border/50">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>Fill in the information below to create a new invoice</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <InvoiceForm onSuccess={handleSuccess} />
                </CardContent>
            </Card>
        </div>
    )
}

