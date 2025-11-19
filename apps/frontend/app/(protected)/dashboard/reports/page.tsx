"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardReportsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Reports</h1>
                <p className="text-muted-foreground">
                    Generate and view custom dashboard reports
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Custom Reports</CardTitle>
                    <CardDescription>
                        Create custom reports based on your business needs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        Custom report builder coming soon
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


