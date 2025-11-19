"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, CreditCard, Globe } from "lucide-react"

export default function IntegrationsSettingsPage() {
    const integrations = [
        {
            name: "QuickBooks Online",
            description: "Sync your accounting data with QuickBooks",
            connected: true,
            icon: Building2
        },
        {
            name: "Stripe",
            description: "Accept online payments from your clients",
            connected: true,
            icon: CreditCard
        },
        {
            name: "PayPal",
            description: "Process payments through PayPal",
            connected: false,
            icon: CreditCard
        },
        {
            name: "Google Drive",
            description: "Store and share documents in Google Drive",
            connected: false,
            icon: Globe
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground">
                    Connect with third-party services and tools
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Available Integrations</CardTitle>
                    <CardDescription>
                        Connect your accounting system with external services
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {integrations.map((integration, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded-lg">
                                    <integration.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{integration.name}</h4>
                                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {integration.connected && (
                                    <Badge variant="outline" className="text-green-600">Connected</Badge>
                                )}
                                <Button variant={integration.connected ? "outline" : "default"}>
                                    {integration.connected ? "Configure" : "Connect"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

