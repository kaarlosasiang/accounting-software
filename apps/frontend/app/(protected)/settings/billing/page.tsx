"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"

export default function BillingSettingsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing Settings</h1>
                <p className="text-muted-foreground">
                    Manage your subscription and payment methods
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                        Your subscription details
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold">Professional Plan</h3>
                            <p className="text-sm text-muted-foreground">Full access to all features</p>
                            <Badge>Active</Badge>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold">$49</div>
                            <div className="text-sm text-muted-foreground">per month</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>
                        Manage your payment methods
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <CreditCard className="h-6 w-6" />
                            <div>
                                <p className="font-medium">•••• •••• •••• 4242</p>
                                <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                            </div>
                        </div>
                        <Badge variant="outline">Default</Badge>
                    </div>
                    <Button variant="outline" className="mt-4">
                        Add Payment Method
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

