"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountForm } from "@/components/forms/account-form";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { accountsService, type Account } from "@/lib/services/accounts.service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";

export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const result = await accountsService.getAccountById(accountId);
        if (result.success && result.data) {
          setAccount(result.data);
        } else {
          toast.error("Account not found");
          router.push("/accounts");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load account",
        );
        router.push("/accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId, router, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!account) {
    return null;
  }

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
            {account.accountCode} - {account.accountName}
          </h1>
          <p className="text-muted-foreground text-sm">
            View and manage account details
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">Edit Account</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account Code</p>
                  <p className="text-lg font-semibold">{account.accountCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Name</p>
                  <p className="text-lg font-semibold">{account.accountName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <p className="text-lg font-semibold">{account.accountType}</p>
                </div>
                {account.subType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Sub Type</p>
                    <p className="text-lg font-semibold">{account.subType}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Normal Balance
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                      account.normalBalance === "Debit"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {account.normalBalance}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Balance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Current Balance
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(account.balance || 0)}
                  </p>
                </div>
                {account.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{account.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {account.createdAt
                      ? new Date(account.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm">
                    {account.updatedAt
                      ? new Date(account.updatedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {account.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{account.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Account</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountForm initialData={account} isEdit={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
