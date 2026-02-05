import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountForm } from "@/components/forms/account-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CreateAccountPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/accounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Create New Account
          </h1>
          <p className="text-muted-foreground text-sm">
            Add a new account to your chart of accounts
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
