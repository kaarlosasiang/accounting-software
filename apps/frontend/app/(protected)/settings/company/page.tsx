"use client";

import { LogOut, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization, useOrganizationRole } from "@/hooks/use-organization";
import { authClient, useListOrganizations } from "@/lib/config/auth-client";
import { useAuth } from "@/lib/contexts/auth-context";

const BUSINESS_TYPES = [
  { value: "sole proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "corporation", label: "Corporation" },
  { value: "non-profit", label: "Non-Profit" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
] as const;

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Real Estate",
  "Hospitality",
  "Transportation",
  "Consulting",
  "Media & Entertainment",
  "Non-Profit",
  "Other",
];

export default function CompanySettingsPage() {
  const router = useRouter();
  const { activeOrganization, isPending, organization, organizationId } =
    useOrganization();
  const { isOwner } = useOrganizationRole();
  const { user } = useAuth();
  const { data: orgListData } = useListOrganizations();

  const [isSaving, setIsSaving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const [form, setForm] = useState({
    name: "",
    businessType: "",
    taxId: "",
    industry: "",
    description: "",
    // Address
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    // Contact
    phone: "",
    email: "",
    website: "",
  });

  // Pre-fill form when org data loads
  useEffect(() => {
    if (!activeOrganization) return;
    const addr = activeOrganization.metadata?.address?.[0] ?? {};
    const contact = activeOrganization.metadata?.contact?.[0] ?? {};
    setForm({
      name: activeOrganization.name ?? "",
      businessType: activeOrganization.businessType ?? "",
      taxId: activeOrganization.taxId ?? "",
      industry: activeOrganization.metadata?.industry ?? "",
      description: activeOrganization.metadata?.description ?? "",
      street: addr.street ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zipCode: addr.zipCode ?? "",
      country: addr.country ?? "",
      phone: contact.phone ?? "",
      email: contact.email ?? "",
      website: contact.website ?? "",
    });
  }, [activeOrganization]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const afterOrgExit = async () => {
    const orgs = (orgListData as any[] | null | undefined) ?? [];
    const remaining = orgs.filter((o: any) => o.id !== organizationId);
    if (remaining.length > 0) {
      await (authClient as any).organization.setActive({
        organizationId: remaining[0].id,
      });
      router.push("/dashboard");
      window.location.reload();
    } else {
      router.push("/company-setup");
    }
  };

  const handleLeaveOrg = async () => {
    if (!organizationId || !user?.id) return;
    setIsLeaving(true);
    try {
      const result = await (authClient as any).organization.removeMember({
        memberIdOrEmail: user.id,
        organizationId,
      });
      if (result?.error) throw new Error(result.error.message);
      toast.success("You have left the organization");
      await afterOrgExit();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to leave organization",
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!organizationId) return;
    setIsDeleting(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
        "http://localhost:4000/api/v1";
      const res = await fetch(`${apiBase}/company`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to delete organization");
      }
      toast.success("Organization deleted");
      await afterOrgExit();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete organization",
      );
    } finally {
      setIsDeleting(false);
      setDeleteConfirmName("");
    }
  };

  const handleSave = async () => {
    if (!organization?.update || !organizationId) {
      toast.error("Unable to save — organization not found");
      return;
    }
    setIsSaving(true);
    try {
      const result = await organization.update({
        organizationId,
        data: {
          name: form.name,
          businessType: form.businessType as any,
          taxId: form.taxId,
          metadata: {
            ...activeOrganization?.metadata,
            industry: form.industry,
            description: form.description,
            address: [
              {
                street: form.street,
                city: form.city,
                state: form.state,
                zipCode: form.zipCode,
                country: form.country,
              },
            ],
            contact: [
              {
                phone: form.phone,
                email: form.email,
                website: form.website,
              },
            ],
          },
        },
      });

      if (result?.error) {
        toast.error(result.error.message ?? "Failed to save company settings");
      } else {
        toast.success("Company settings saved");
      }
    } catch {
      toast.error("Failed to save company settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
          Company Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your company information and branding
        </p>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Update your company details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / Registration No.</Label>
                  <Input
                    id="taxId"
                    value={form.taxId}
                    onChange={(e) => handleChange("taxId", e.target.value)}
                    placeholder="e.g. 123-456-789"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Select
                    value={form.businessType}
                    onValueChange={(v) => handleChange("businessType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    value={form.industry}
                    onValueChange={(v) => handleChange("industry", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Short description of your business"
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
          <CardDescription>Your primary business location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={form.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State / Province</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={form.zipCode}
                    onChange={(e) => handleChange("zipCode", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Philippines"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How clients can reach your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+63 900 000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="hello@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://company.com"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            These actions are irreversible. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Leave Organization — hidden for owners */}
          {!isOwner && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Leave Organization</p>
                <p className="text-xs text-muted-foreground">
                  Remove yourself from this organization. You'll lose access to
                  all its data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave organization?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll be removed from{" "}
                      <strong>{activeOrganization?.name}</strong> and lose
                      access to all its data. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLeaveOrg}
                      disabled={isLeaving}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isLeaving ? "Leaving…" : "Leave Organization"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Delete Organization — owners only */}
          {isOwner && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Delete Organization</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this organization and all its data. This
                  cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="shrink-0">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete organization?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">
                        This will permanently delete{" "}
                        <strong>{activeOrganization?.name}</strong> and all
                        associated data (invoices, accounts, customers, etc.).
                      </span>
                      <span className="block">
                        Type <strong>{activeOrganization?.name}</strong> below
                        to confirm.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    placeholder={activeOrganization?.name}
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    className="mx-6"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmName("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteOrg}
                      disabled={
                        isDeleting ||
                        deleteConfirmName !== activeOrganization?.name
                      }
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting…" : "Delete Organization"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
