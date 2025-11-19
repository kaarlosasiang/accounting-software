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
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Link href="/invoices">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
                    <p className="text-muted-foreground">
                        Create a new invoice for your client
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>
                        Fill in the information below to create a new invoice
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InvoiceForm onSuccess={handleSuccess} />
                </CardContent>
            </Card>
        </div>
    )
}

