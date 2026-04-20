"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InvoiceForm } from "@/components/forms/invoice-form/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type Invoice,
  invoiceService,
} from "@/lib/services/invoice.service";

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await invoiceService.getInvoiceById(invoiceId);
        if (response.success && response.data) {
          setInvoice(response.data);
        } else {
          setError(response.error || "Failed to load invoice");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load invoice",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const handleSuccess = () => {
    router.push(`/invoices/${invoiceId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>
              {error || "The invoice you are trying to edit could not be found."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/invoices">
              <Button>Back to Invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invoice.status !== "Draft") {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Invoice Cannot Be Edited</CardTitle>
            <CardDescription>
              Only draft invoices can be edited from this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/invoices/${invoiceId}`}>
              <Button>Back to Invoice</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Edit Invoice
          </h1>
          <p className="text-muted-foreground text-sm">
            Update your draft invoice before sending it to the client
          </p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>
            Review and update the information below before saving
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <InvoiceForm
            invoiceId={invoiceId}
            initialData={invoice}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}