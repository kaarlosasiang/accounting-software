"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Save } from "lucide-react";

export default function CompanySettingsPage() {
  const [isLoading] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
          Company Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your company information and branding
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Update your company details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" defaultValue="RRD10 Accounting" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyEmail">Company Email</Label>
            <Input id="companyEmail" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={3} />
          </div>
          <div className="flex justify-end">
            <Button disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
