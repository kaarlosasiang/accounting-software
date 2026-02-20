"use client";

import { useState, useEffect } from "react";
import { Plus, Lock, Unlock, Calendar, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePeriods } from "@/hooks/use-periods";
import type {
  AccountingPeriod,
  PeriodType,
} from "@/lib/services/period.service";

export default function PeriodsPage() {
  const {
    periods,
    isLoading,
    fetchPeriods,
    createPeriod,
    closePeriod,
    reopenPeriod,
    lockPeriod,
    deletePeriod,
  } = usePeriods();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<
    "close" | "reopen" | "lock" | "delete" | null
  >(null);

  const [formData, setFormData] = useState({
    periodName: "",
    startDate: "",
    endDate: "",
    periodType: "Monthly" as PeriodType,
    fiscalYear: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleCreatePeriod = async () => {
    if (!formData.periodName || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createPeriod(formData);
    setCreateDialogOpen(false);
    setFormData({
      periodName: "",
      startDate: "",
      endDate: "",
      periodType: "Monthly",
      fiscalYear: new Date().getFullYear(),
    });
  };

  const handleConfirmAction = async () => {
    if (!selectedPeriod || !confirmAction) return;

    let success = false;

    switch (confirmAction) {
      case "close":
        const closeResult = await closePeriod(selectedPeriod._id);
        success = !!closeResult;
        break;
      case "reopen":
        const reopenResult = await reopenPeriod(selectedPeriod._id);
        success = !!reopenResult;
        break;
      case "lock":
        const lockResult = await lockPeriod(selectedPeriod._id);
        success = !!lockResult;
        break;
      case "delete":
        success = await deletePeriod(selectedPeriod._id);
        break;
    }

    if (success) {
      setConfirmDialogOpen(false);
      setSelectedPeriod(null);
      setConfirmAction(null);
    }
  };

  const openConfirmDialog = (
    period: AccountingPeriod,
    action: "close" | "reopen" | "lock" | "delete",
  ) => {
    setSelectedPeriod(period);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-600 border-green-500/20"
          >
            <Unlock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case "Closed":
        return (
          <Badge
            variant="outline"
            className="bg-orange-500/10 text-orange-600 border-orange-500/20"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      case "Locked":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 border-red-500/20"
          >
            <Lock className="h-3 w-3 mr-1" />
            Locked
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfirmDialogContent = () => {
    if (!selectedPeriod || !confirmAction) return null;

    const actionDetails = {
      close: {
        title: "Close Period",
        description: (
          <>
            Are you sure you want to close the period{" "}
            <span className="font-semibold">{selectedPeriod.periodName}</span>?
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>
                Creates closing entries to transfer Revenue/Expense balances to
                Retained Earnings
              </li>
              <li>
                Prevents new transactions from being posted to this period
              </li>
              <li>Can be reopened if needed</li>
            </ul>
          </>
        ),
        actionText: "Close Period",
        actionClass: "bg-orange-600 hover:bg-orange-700",
      },
      reopen: {
        title: "Reopen Period",
        description: (
          <>
            Are you sure you want to reopen the period{" "}
            <span className="font-semibold">{selectedPeriod.periodName}</span>?
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Voids the closing journal entries</li>
              <li>Allows transactions to be posted again</li>
              <li>May affect subsequent closed periods</li>
            </ul>
            <p className="mt-2 font-semibold text-yellow-600">
              This will reverse the closing process.
            </p>
          </>
        ),
        actionText: "Reopen Period",
        actionClass: "bg-blue-600 hover:bg-blue-700",
      },
      lock: {
        title: "Lock Period",
        description: (
          <>
            Are you sure you want to lock the period{" "}
            <span className="font-semibold">{selectedPeriod.periodName}</span>?
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Permanently prevents modifications to this period</li>
              <li>Cannot be reopened once locked</li>
              <li>Ensures audit trail integrity</li>
            </ul>
            <p className="mt-2 font-semibold text-red-600">
              This action cannot be undone!
            </p>
          </>
        ),
        actionText: "Lock Period",
        actionClass: "bg-red-600 hover:bg-red-700",
      },
      delete: {
        title: "Delete Period",
        description: (
          <>
            Are you sure you want to delete the period{" "}
            <span className="font-semibold">{selectedPeriod.periodName}</span>?
            <p className="mt-2 font-semibold text-red-600">
              This action cannot be undone!
            </p>
          </>
        ),
        actionText: "Delete Period",
        actionClass: "bg-red-600 hover:bg-red-700",
      },
    };

    return actionDetails[confirmAction];
  };

  const confirmContent = getConfirmDialogContent();

  const openPeriods = periods.filter((p) => p.status === "Open");
  const closedPeriods = periods.filter((p) => p.status === "Closed");
  const lockedPeriods = periods.filter((p) => p.status === "Locked");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
            Accounting Periods
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage fiscal periods and period closing
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Period
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Accounting Period</DialogTitle>
              <DialogDescription>
                Define a new fiscal period for your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="periodName">Period Name</Label>
                <Input
                  id="periodName"
                  placeholder="e.g., January 2025"
                  value={formData.periodName}
                  onChange={(e) =>
                    setFormData({ ...formData, periodName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscalYear">Fiscal Year</Label>
                <Input
                  id="fiscalYear"
                  type="number"
                  placeholder="2025"
                  value={formData.fiscalYear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fiscalYear: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodType">Period Type</Label>
                <Select
                  value={formData.periodType}
                  onValueChange={(value: PeriodType) =>
                    setFormData({ ...formData, periodType: value })
                  }
                >
                  <SelectTrigger id="periodType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePeriod}>Create Period</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Periods</CardTitle>
            <Unlock className="h-4 w-4 text-green-600 group-hover:text-green-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {openPeriods.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active accounting periods
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Closed Periods
            </CardTitle>
            <XCircle className="h-4 w-4 text-orange-600 group-hover:text-orange-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {closedPeriods.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Periods pending lock
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Locked Periods
            </CardTitle>
            <Lock className="h-4 w-4 text-red-600 group-hover:text-red-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lockedPeriods.length}
            </div>
            <p className="text-xs text-muted-foreground">Permanently secured</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Periods</CardTitle>
          <CardDescription>
            Manage accounting periods and their lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading periods...
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accounting periods found. Create your first period to get
              started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow key={period._id}>
                      <TableCell className="font-medium">
                        {period.periodName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-600 border-blue-500/20"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {period.periodType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(period.startDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(period.endDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{getStatusBadge(period.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {period.status === "Open" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openConfirmDialog(period, "close")}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Close
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() =>
                                openConfirmDialog(period, "delete")
                              }
                            >
                              Delete
                            </Button>
                          </>
                        )}
                        {period.status === "Closed" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openConfirmDialog(period, "reopen")
                              }
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Reopen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openConfirmDialog(period, "lock")}
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Lock
                            </Button>
                          </>
                        )}
                        {period.status === "Locked" && (
                          <span className="text-sm text-muted-foreground">
                            No actions available
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {confirmContent && (
        <AlertDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmContent.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmContent.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                className={confirmContent.actionClass}
              >
                {confirmContent.actionText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
