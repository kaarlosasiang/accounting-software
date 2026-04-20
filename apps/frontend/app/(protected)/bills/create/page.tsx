"use client";

import { useRouter } from "next/navigation";

import { BillForm } from "@/components/forms/bill-form/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreateBillPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/bills");
  };

  const handleCancel = () => {
    router.push("/bills");
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Create Bill
          </h1>
          <p className="text-muted-foreground text-sm">
            Create a new bill for supplier purchases or operating expenses
          </p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle>Bill Details</CardTitle>
          <CardDescription>
            Fill in the information below to create a new bill
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <BillForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
}
