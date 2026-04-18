"use client";

import { NewOrgForm } from "@/components/forms/new-org-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewOrgModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewOrgModal({ open, onOpenChange }: NewOrgModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    // page reload happens inside CompanySetupForm via router.push("/dashboard")
    // but since we're using onSuccess callback, we handle it here instead
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Organization</DialogTitle>
          <DialogDescription>
            Set up a new company. You'll be switched to it automatically.
          </DialogDescription>
        </DialogHeader>
        <NewOrgForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
