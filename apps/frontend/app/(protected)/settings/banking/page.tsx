"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/use-organization";
import { companySettingsService } from "@/lib/services/company-settings.service";
import { accountsService } from "@/lib/services/accounts.service";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  linkedAccountId?: string;
  isActive: boolean;
  notes?: string;
}

export default function BankingSettingsPage() {
  const { organizationId } = useOrganization();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [chartAccounts, setChartAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
    null,
  );

  // Form state
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    bankName: "",
    accountName: "",
    accountNumber: "",
    accountType: "Checking",
    currency: "PHP",
    linkedAccountId: "",
    isActive: true,
    notes: "",
  });

  // Fetch company settings with bank accounts
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setIsLoading(true);
        const result = await companySettingsService.getCompanySettings();
        if (result.success && result.data) {
          setBankAccounts(result.data.banking?.accounts || []);
        }
      } catch (err) {
        console.error("Failed to fetch bank accounts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load bank accounts",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      fetchBankAccounts();
    }
  }, [organizationId]);

  // Fetch chart of accounts for linking
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const result = await accountsService.getAccountsByType("Asset");
        if (result.success && result.data) {
          // Filter for Bank and Cash subtypes
          const bankAccounts = result.data.filter(
            (acc) => acc.subType === "Bank" || acc.subType === "Cash",
          );
          setChartAccounts(bankAccounts);
        }
      } catch (err) {
        console.error("Failed to fetch chart accounts:", err);
      }
    };

    if (organizationId) {
      fetchAccounts();
    }
  }, [organizationId]);

  const handleOpenDialog = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData(account);
    } else {
      setEditingAccount(null);
      setFormData({
        bankName: "",
        accountName: "",
        accountNumber: "",
        accountType: "Checking",
        currency: "PHP",
        linkedAccountId: "",
        isActive: true,
        notes: "",
      });
    }
    setDialogOpen(true);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    // Validation
    if (
      !formData.bankName ||
      !formData.accountName ||
      !formData.accountNumber
    ) {
      setError("Bank name, account name, and account number are required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...formData,
        linkedAccountId: formData.linkedAccountId || undefined,
      };

      const result = editingAccount
        ? await companySettingsService.updateBankAccount(
            editingAccount.id,
            payload,
          )
        : await companySettingsService.addBankAccount(payload as any);

      if (result.success && result.data) {
        setBankAccounts(result.data.banking?.accounts || []);
        setSuccess(
          `Bank account ${editingAccount ? "updated" : "added"} successfully`,
        );
        setDialogOpen(false);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error(result.error || "Failed to save bank account");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save bank account",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const result = await companySettingsService.removeBankAccount(accountId);

      if (result.success && result.data) {
        setBankAccounts(result.data.banking?.accounts || []);
        setSuccess("Bank account deleted successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error(result.error || "Failed to delete bank account");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete bank account",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const maskAccountNumber = (number: string) => {
    if (number.length <= 4) return number;
    return "****" + number.slice(-4);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Banking Settings
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your bank accounts for record-keeping
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Edit" : "Add"} Bank Account
              </DialogTitle>
              <DialogDescription>
                Add your bank account details for record-keeping purposes. This
                is not connected to your actual bank.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">
                    Bank Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., BDO, BPI, Metrobank"
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, accountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Checking">Checking</SelectItem>
                      <SelectItem value="Savings">Savings</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">
                  Account Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountName"
                  placeholder="e.g., Company Checking Account"
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">
                    Account Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter account number"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Will be masked for security
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHP">PHP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedAccount">
                  Link to Chart of Accounts (Optional)
                </Label>
                <Select
                  value={formData.linkedAccountId || "__none__"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      linkedAccountId: value === "__none__" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {chartAccounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.accountCode} - {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link this bank account to an account in your chart of accounts
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this account"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active Account</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAccount ? "Update" : "Add"} Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && !dialogOpen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
          <CardDescription>
            Manage your company's bank accounts for transaction recording and
            reconciliation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bank accounts yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first bank account to start recording transactions
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.bankName}
                    </TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {maskAccountNumber(account.accountNumber)}
                    </TableCell>
                    <TableCell>{account.accountType}</TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell>
                      <Badge
                        variant={account.isActive ? "default" : "secondary"}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(account)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
